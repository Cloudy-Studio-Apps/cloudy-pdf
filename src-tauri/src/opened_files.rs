//! Files the operating system asks the app to open ("Open with…", default app).
//!
//! Paths are queued in [`PendingFiles`] and the frontend is notified through
//! [`FILES_PENDING_EVENT`]; it then drains the queue with `take_pending_files`.
//! Queueing (instead of emitting the payload) means nothing is lost if the
//! request arrives before the webview is listening, which is always the case
//! at launch, since the file arrives before React has loaded.
//!
//! Frontend counterpart: `src/modules/document/services/opened-files.service.ts`.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, RunEvent, Runtime, State};

/// Event name; must match `FILES_PENDING_EVENT` in `src/modules/document/document.constants.ts`.
pub const FILES_PENDING_EVENT: &str = "opened-files://pending";

/// Queue of paths/URIs waiting to be opened by the frontend.
/// Wrapped in a Mutex because Tauri state is shared across threads.
#[derive(Default)]
pub struct PendingFiles(Mutex<Vec<String>>);

/// Adds files to the queue and tells the frontend to come and get them.
pub fn enqueue<R: Runtime>(app: &AppHandle<R>, files: Vec<String>) {
    if files.is_empty() {
        return;
    }
    if let Ok(mut pending) = app.state::<PendingFiles>().0.lock() {
        pending.extend(files);
    }
    // If nobody is listening yet (app still starting), the event is simply lost;
    // that's fine, because the frontend also drains the queue once on startup.
    let _ = app.emit(FILES_PENDING_EVENT, ());
}

/// Command called from the frontend: returns all queued files and empties the queue,
/// so each file is opened exactly once.
#[tauri::command]
pub fn take_pending_files(state: State<'_, PendingFiles>) -> Vec<String> {
    state
        .0
        .lock()
        .map(|mut pending| std::mem::take(&mut *pending))
        .unwrap_or_default()
}

/// Desktop: files arrive as command-line arguments (`Exec=… %F` in the .desktop file).
/// Each one is added to the fs scope so the frontend is allowed to read it.
#[cfg(desktop)]
pub fn from_args<R: Runtime>(
    app: &AppHandle<R>,
    args: &[String],
    cwd: &std::path::Path,
) -> Vec<String> {
    use tauri_plugin_fs::FsExt;

    args.iter()
        // args[0] is the program itself.
        .skip(1)
        // Ignore flags like `--verbose`.
        .filter(|arg| !arg.starts_with('-'))
        // Relative paths (`cloudy-pdf doc.pdf` from a terminal) are resolved against
        // the directory the command was run from; absolute paths stay unchanged.
        .map(|arg| cwd.join(arg))
        .filter(|path| path.is_file())
        // Security: the fs plugin only reads files inside its scope. Grant access to
        // exactly this file (not its folder or the whole disk).
        .filter(|path| app.fs_scope().allow_file(path).is_ok())
        .map(|path| path.to_string_lossy().into_owned())
        .collect()
}

/// Mobile: files arrive as `content://` URLs through the run loop.
/// Android URLs need no scope grant: the fs plugin reads them through Android's
/// ContentResolver, using the (temporary) permission granted with the "open" intent.
pub fn handle_run_event<R: Runtime>(app: &AppHandle<R>, event: &RunEvent) {
    // `RunEvent::Opened` only exists on these platforms, so this must be compiled conditionally.
    #[cfg(any(target_os = "android", target_os = "ios", target_os = "macos"))]
    if let RunEvent::Opened { urls } = event {
        let app = app.clone();
        let urls: Vec<String> = urls.iter().map(ToString::to_string).collect();
        // Open each file right now, while Android's temporary grant is valid (see
        // `document_source::open_file`), and only then tell the frontend. Off the
        // event loop, because opening a `content://` URI is a blocking call into Kotlin.
        tauri::async_runtime::spawn_blocking(move || {
            for url in &urls {
                crate::document_source::retain_grant(&app, url);
            }
            enqueue(&app, urls);
        });
    }

    // On Linux/Windows nothing to do here; this line just silences "unused variable" warnings.
    #[cfg(not(any(target_os = "android", target_os = "ios", target_os = "macos")))]
    let _ = (app, event);
}
