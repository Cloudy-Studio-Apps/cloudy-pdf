//! Which files the frontend may ask Rust to touch.
//!
//! Shared by every command that receives a path from the webview, so they all
//! apply the same rule as the fs plugin's own commands.

use tauri::{AppHandle, Runtime};
use tauri_plugin_fs::{FilePath, FsExt};

/// Parses `path` and checks it's a file the app was granted (opened via the
/// dialog, the OS, or Recent); never an arbitrary path.
///
/// Android `content://` URIs skip the scope check, like the fs plugin does:
/// access to them is granted by Android itself with the "open" intent.
pub fn ensure_allowed<R: Runtime>(app: &AppHandle<R>, path: &str) -> Result<FilePath, String> {
    let file_path: FilePath = path.parse().unwrap_or_else(|never| match never {});

    let allowed = match &file_path {
        FilePath::Url(url) if cfg!(mobile) && url.scheme() == "content" => true,
        // On desktop a `file://` URL is just another spelling of a path: check that path.
        FilePath::Url(url) => url
            .to_file_path()
            .is_ok_and(|path| app.fs_scope().is_allowed(path)),
        FilePath::Path(path) => app.fs_scope().is_allowed(path),
    };

    if allowed {
        Ok(file_path)
    } else {
        Err("This file is not accessible to the app.".into())
    }
}
