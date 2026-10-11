//! "Open with…": shows the system's application chooser for a file.
//!
//! Linux: uses the XDG Desktop Portal (`org.freedesktop.portal.OpenURI` with
//! `ask = true`). The portal is the standard, desktop-agnostic way to do this:
//! KDE, GNOME and others each show their own native "Open with" dialog.
//! Other platforms are not supported yet and return an error.

use tauri::{AppHandle, Runtime};

use crate::scope::ensure_allowed;

/// Command called from the frontend with the file to open.
#[tauri::command]
pub async fn open_with<R: Runtime>(app: AppHandle<R>, path: String) -> Result<(), String> {
    // Security: only files the app was already granted can be handed to other apps.
    ensure_allowed(&app, &path)?;
    show_app_chooser(&path).await
}

#[cfg(target_os = "linux")]
async fn show_app_chooser(path: &str) -> Result<(), String> {
    use ashpd::desktop::open_uri::OpenFileRequest;
    use ashpd::desktop::ResponseError;

    // The portal receives an open file descriptor rather than a path, so it also
    // works for sandboxed apps (Flatpak) and can't be tricked into opening another file.
    let file = std::fs::File::open(path).map_err(|error| error.to_string())?;
    let result = OpenFileRequest::default()
        .ask(true)
        .send_file(&file)
        .await
        .and_then(|request| request.response());

    match result {
        Ok(()) => Ok(()),
        // Closing the chooser without picking an app is not an error.
        Err(ashpd::Error::Response(ResponseError::Cancelled)) => Ok(()),
        Err(error) => Err(format!("Could not show the “Open with” dialog: {error}")),
    }
}

#[cfg(not(target_os = "linux"))]
async fn show_app_chooser(_path: &str) -> Result<(), String> {
    Err("“Open with” is not supported on this platform yet.".into())
}
