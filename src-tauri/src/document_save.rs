//! Writes an edited document (filled form fields) to disk: "Save" and "Save as…".
//!
//! The bytes come from pdf.js (`saveDocument`) as the raw request body, and the
//! destination path as a percent-encoded header (headers must be ASCII, paths
//! often aren't). Raw bodies skip JSON on desktop; Android's IPC can't send raw
//! bodies, so there they arrive as a JSON array of numbers instead.
//! Command name must match `document.constants.ts`.

use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

use percent_encoding::percent_decode_str;
use serde::Deserialize;
use tauri::ipc::{InvokeBody, Request};
use tauri::{AppHandle, Runtime};
use tauri_plugin_fs::{FilePath, FsExt, OpenOptions};

use crate::document_source::blocking;
use crate::scope::ensure_allowed;

/// Must match `SAVE_PATH_HEADER` in `document.constants.ts`.
const PATH_HEADER: &str = "x-document-path";

/// Saves the request body to the path in its header. Returns the new file size.
#[tauri::command]
pub async fn save_document<R: Runtime>(app: AppHandle<R>, request: Request<'_>) -> Result<u64, String> {
    let path = path_header(&request)?;
    let bytes = match request.body() {
        InvokeBody::Raw(bytes) => bytes.clone(),
        InvokeBody::Json(value) => Vec::<u8>::deserialize(value).map_err(|error| error.to_string())?,
    };
    let size = bytes.len() as u64;
    blocking(move || write_file(&app, &path, &bytes)).await?;
    Ok(size)
}

fn path_header(request: &Request<'_>) -> Result<String, String> {
    let encoded = request
        .headers()
        .get(PATH_HEADER)
        .and_then(|value| value.to_str().ok())
        .ok_or("No destination path was given.")?;
    percent_decode_str(encoded)
        .decode_utf8()
        .map(|path| path.into_owned())
        .map_err(|error| error.to_string())
}

/// Only files the app was granted (opened, or picked in the "Save as" dialog, which
/// adds them to the scope) can be written. Also used by the PDF tools (`tools/`).
pub(crate) fn write_file<R: Runtime>(app: &AppHandle<R>, path: &str, bytes: &[u8]) -> Result<(), String> {
    match ensure_allowed(app, path)? {
        FilePath::Path(path) => replace_file(&path, bytes),
        FilePath::Url(url) if url.scheme() == "file" => {
            let path = url.to_file_path().map_err(|()| "Invalid file URL.".to_string())?;
            replace_file(&path, bytes)
        }
        // Android `content://`: only the content provider can write it, in place.
        uri => {
            let mut options = OpenOptions::new();
            options.write(true).truncate(true).create(true);
            let mut file = app.fs().open(uri, options).map_err(|error| error.to_string())?;
            file.write_all(bytes).map_err(|error| error.to_string())
        }
    }
}

/// Writes a temporary file next to `path`, then renames it over `path`.
///
/// Why not overwrite in place: the viewer is still reading the old file through
/// its open descriptor (see `document_source.rs`). A rename gives the path a new
/// file and leaves that descriptor on the old one, so its reads stay consistent.
/// It also means a failed write never leaves a half-written PDF behind.
fn replace_file(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let directory = path.parent().ok_or("Invalid destination path.")?;
    let name = path.file_name().ok_or("Invalid destination path.")?.to_string_lossy();
    let temporary = directory.join(format!(".{name}.{}.tmp", std::process::id()));

    let result = (|| {
        let mut file = File::create(&temporary)?;
        file.write_all(bytes)?;
        file.sync_all()?;
        // Keep the original's permissions (File::create uses the default ones).
        if let Ok(metadata) = fs::metadata(path) {
            fs::set_permissions(&temporary, metadata.permissions())?;
        }
        fs::rename(&temporary, path)
    })();

    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result.map_err(|error| error.to_string())
}
