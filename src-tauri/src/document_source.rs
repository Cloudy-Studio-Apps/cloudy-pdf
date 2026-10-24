//! Serves PDF bytes to the frontend on demand, in byte ranges.
//!
//! Why: reading the whole file into JS (and copying it into the pdf.js worker)
//! costs twice the file size in memory per open tab, and the first page can only
//! appear once the last byte has been read. Instead, pdf.js asks for the ranges
//! it needs (the cross-reference table, then the objects of the visible pages)
//! and Rust reads just those with positioned reads. A 500 MB PDF opens as fast
//! as a 1 MB one, and memory follows what is viewed, not the file size.
//!
//! Lifecycle: `open_document` → many `read_document_range` → `close_document`.
//! Frontend counterpart: `src/modules/pdf/services/pdf-source.service.ts`.
//! Command names must match `pdf.constants.ts` and `document.constants.ts`.

use std::collections::HashMap;
use std::fs::File;
use std::io::{self, Read};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::{Arc, Mutex};

use serde::Serialize;
use tauri::ipc::Response;
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_fs::{FilePath, FsExt, OpenOptions};

use crate::scope::ensure_allowed;

/// Where a document's bytes come from.
enum Source {
    /// A regular file: read directly at any offset, nothing kept in memory.
    File(File),
    /// Not seekable (some Android providers hand over a pipe): read once, kept in memory.
    Memory(Vec<u8>),
}

/// An open document. Shared through an `Arc`, so reads run in parallel without
/// holding the registry lock (positioned reads don't move a shared cursor).
struct OpenSource {
    source: Source,
    size: u64,
}

impl OpenSource {
    fn open<R: Runtime>(app: &AppHandle<R>, path: &str) -> Result<Self, String> {
        let mut file = open_file(app, path)?;
        let metadata = file.metadata().map_err(|error| error.to_string())?;

        if metadata.is_file() {
            return Ok(Self { size: metadata.len(), source: Source::File(file) });
        }
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).map_err(|error| error.to_string())?;
        Ok(Self { size: bytes.len() as u64, source: Source::Memory(bytes) })
    }

    /// Bytes `[offset, offset + length)`, cut short at the end of the file.
    fn read(&self, offset: u64, length: u64) -> io::Result<Vec<u8>> {
        let start = offset.min(self.size);
        let end = offset.saturating_add(length).min(self.size);
        match &self.source {
            Source::File(file) => {
                let mut buffer = vec![0; (end - start) as usize];
                read_exact_at(file, &mut buffer, start)?;
                Ok(buffer)
            }
            Source::Memory(bytes) => Ok(bytes[start as usize..end as usize].to_vec()),
        }
    }
}

/// Opens a file for reading, checking the scope first.
///
/// Goes through the fs plugin so Android `content://` URIs work too (it asks the
/// ContentResolver for a file descriptor); on desktop it's a plain `File::open`.
///
/// Android only grants *temporary* access to a URI received with "Open with…",
/// and revokes it when the task changes (switching apps, a reload). Opening it
/// again after that fails with "No content provider". An already open descriptor
/// keeps working though, so the first one for each URI is kept in
/// [`DocumentSources::granted`] and later opens get a duplicate of it.
pub(crate) fn open_file<R: Runtime>(app: &AppHandle<R>, path: &str) -> Result<File, String> {
    let file_path = ensure_allowed(app, path)?;
    let is_content_uri = matches!(&file_path, FilePath::Url(url) if url.scheme() == "content");
    let granted = &app.state::<DocumentSources>().granted;

    if is_content_uri {
        let granted = granted.lock().map_err(|error| error.to_string())?;
        if let Some(file) = granted.get(path) {
            return file.try_clone().map_err(|error| error.to_string());
        }
    }

    // `read(true)` must be explicit: despite the plugin's docs, `OpenOptions::new()`
    // is a derived Default with every flag false ("read defaults to true" only
    // applies when the options are deserialized from JS).
    let mut options = OpenOptions::new();
    options.read(true);
    let file = app
        .fs()
        .open(file_path, options)
        .map_err(|error| error.to_string())?;

    // Pipes can't be kept: they can be read only once, and the first reader drains them.
    let is_regular = file.metadata().is_ok_and(|metadata| metadata.is_file());
    if is_content_uri && is_regular {
        let copy = file.try_clone().map_err(|error| error.to_string())?;
        granted
            .lock()
            .map_err(|error| error.to_string())?
            .insert(path.to_owned(), copy);
    }
    Ok(file)
}

/// Reads a whole file, for the PDF tools (which need the complete document).
///
/// Positioned reads, not `read_to_end`: on Android the descriptor is a duplicate
/// of the retained one, and duplicates share one cursor, so reading through it
/// would leave the next opener at the end of the file.
pub(crate) fn read_file<R: Runtime>(app: &AppHandle<R>, path: &str) -> Result<Vec<u8>, String> {
    let source = OpenSource::open(app, path)?;
    source.read(0, source.size).map_err(|error| error.to_string())
}

/// Opens a URI the OS just handed over, while its temporary grant is still valid
/// (see [`open_file`]). Errors are ignored here: the frontend's own open reports them.
#[cfg(any(target_os = "android", target_os = "ios", target_os = "macos"))]
pub fn retain_grant<R: Runtime>(app: &AppHandle<R>, uri: &str) {
    let _ = open_file(app, uri);
}

#[cfg(unix)]
fn read_exact_at(file: &File, buffer: &mut [u8], offset: u64) -> io::Result<()> {
    std::os::unix::fs::FileExt::read_exact_at(file, buffer, offset)
}

#[cfg(windows)]
fn read_exact_at(file: &File, mut buffer: &mut [u8], mut offset: u64) -> io::Result<()> {
    use std::os::windows::fs::FileExt;
    while !buffer.is_empty() {
        match file.seek_read(buffer, offset)? {
            0 => return Err(io::ErrorKind::UnexpectedEof.into()),
            read => {
                buffer = &mut buffer[read..];
                offset += read as u64;
            }
        }
    }
    Ok(())
}

/// Documents currently open in the frontend, by id.
#[derive(Default)]
pub struct DocumentSources {
    next_id: AtomicU32,
    open: Mutex<HashMap<u32, Arc<OpenSource>>>,
    /// Android: a descriptor per `content://` URI, kept for the life of the process
    /// so the file stays readable after its temporary grant is revoked. Not cleared
    /// on reload: restoring the open tabs after a reload depends on it.
    granted: Mutex<HashMap<String, File>>,
}

impl DocumentSources {
    /// Closes everything. Called when the page (re)loads: the old frontend that
    /// owned these ids is gone and will never call `close_document` for them.
    pub fn close_all(&self) {
        if let Ok(mut open) = self.open.lock() {
            open.clear();
        }
    }

    fn get(&self, id: u32) -> Result<Arc<OpenSource>, String> {
        let open = self.open.lock().map_err(|error| error.to_string())?;
        open.get(&id).cloned().ok_or_else(|| "This document is no longer open.".into())
    }
}

#[derive(Serialize)]
pub struct DocumentInfo {
    size: u64,
}

#[derive(Serialize)]
pub struct OpenedSource {
    id: u32,
    size: u64,
}

// All commands are `async` and do their I/O in `spawn_blocking`: a sync Tauri
// command runs on the main thread, where disk reads would stall the window.

/// Checks that a file can be opened and returns its size, without reading it.
#[tauri::command]
pub async fn document_info<R: Runtime>(app: AppHandle<R>, path: String) -> Result<DocumentInfo, String> {
    let source = blocking(move || OpenSource::open(&app, &path)).await?;
    Ok(DocumentInfo { size: source.size })
}

#[tauri::command]
pub async fn open_document<R: Runtime>(
    app: AppHandle<R>,
    sources: State<'_, DocumentSources>,
    path: String,
) -> Result<OpenedSource, String> {
    let source = blocking(move || OpenSource::open(&app, &path)).await?;
    let size = source.size;
    let id = sources.next_id.fetch_add(1, Ordering::Relaxed);
    sources
        .open
        .lock()
        .map_err(|error| error.to_string())?
        .insert(id, Arc::new(source));
    Ok(OpenedSource { id, size })
}

/// Returns raw bytes: `Response` skips JSON, so the frontend receives an ArrayBuffer.
#[tauri::command]
pub async fn read_document_range(
    sources: State<'_, DocumentSources>,
    id: u32,
    offset: u64,
    length: u64,
) -> Result<Response, String> {
    let source = sources.get(id)?;
    let bytes = blocking(move || source.read(offset, length).map_err(|error| error.to_string())).await?;
    Ok(Response::new(bytes))
}

#[tauri::command]
pub async fn close_document(sources: State<'_, DocumentSources>, id: u32) -> Result<(), String> {
    sources.open.lock().map_err(|error| error.to_string())?.remove(&id);
    Ok(())
}

pub(crate) async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|error| error.to_string())?
}
