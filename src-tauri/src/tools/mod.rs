//! PDF tools (the Tools tab): each tool is one command in its own file.
//!
//! Tools work on whole documents with `lopdf`, entirely in Rust: files are read
//! and written here, so no document goes through the webview. Every path is
//! checked against the fs scope by `read_file` / `write_file`, so a tool can only
//! touch files the user picked. Command names must match `tools.constants.ts`.

pub mod info;
pub mod merge;
pub mod split;

use lopdf::Document;
use tauri::{AppHandle, Runtime};

use crate::document_save::write_file;
use crate::document_source::read_file;

/// Reads and parses a PDF the app was granted.
fn load<R: Runtime>(app: &AppHandle<R>, path: &str) -> Result<Document, String> {
    let bytes = read_file(app, path)?;
    let document = Document::load_mem(&bytes).map_err(|error| format!("{}: {error}", file_name(path)))?;
    // lopdf opens files that only have an owner password (no password to view);
    // one that is still encrypted needs a password we don't ask for yet.
    if document.is_encrypted() {
        return Err(format!("{} is password-protected.", file_name(path)));
    }
    Ok(document)
}

/// Serializes `document` and writes it to `path` (atomically on desktop).
fn save<R: Runtime>(app: &AppHandle<R>, document: &mut Document, path: &str) -> Result<(), String> {
    let mut bytes = Vec::new();
    document.save_to(&mut bytes).map_err(|error| error.to_string())?;
    write_file(app, path, &bytes)
}

/// Last part of a path or URI, to name the file in error messages.
fn file_name(path: &str) -> &str {
    path.rsplit(['/', '\\']).next().unwrap_or(path)
}
