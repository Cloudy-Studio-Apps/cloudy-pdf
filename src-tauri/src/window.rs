//! Window helpers.

use tauri::{AppHandle, Manager, Runtime};

/// Label of the window created from `tauri.conf.json` (Tauri's default is "main").
const MAIN_WINDOW: &str = "main";

/// Brings the app to the front, e.g. when a PDF is opened while the app is
/// minimized or behind other windows.
pub fn focus_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
