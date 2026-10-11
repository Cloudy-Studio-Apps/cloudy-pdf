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
use tauri::{AppHandle, Runtime, State};
use tauri_plugin_fs::{FsExt, OpenOptions};

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
        let file_path = ensure_allowed(app, path)?;
        // Goes through the fs plugin so Android `content://` URIs work too (it asks the
        // ContentResolver for a file descriptor); on desktop it's a plain `File::open`.
        // `read(true)` must be explicit: despite the plugin's docs, `OpenOptions::new()`
        // is a derived Default with every flag false ("read defaults to true" only
        // applies when the options are deserialized from JS).
        let mut options = OpenOptions::new();
        options.read(true);
        let mut file = app
            .fs()
            .open(file_path, options)
            .map_err(|error| error.to_string())?;
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

async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|error| error.to_string())?
}
