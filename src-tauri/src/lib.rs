//! Tauri backend: creates the native window that hosts the React frontend
//! and registers the plugins/commands the frontend is allowed to use.

mod document_source;
mod open_with;
mod opened_files;
mod scope;
#[cfg(desktop)]
mod window;

use document_source::DocumentSources;
use opened_files::PendingFiles;
use tauri::Manager;
use tauri::webview::PageLoadEvent;

// On Android/iOS the app starts from this function instead of `main`.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Single instance (desktop only): double-clicking a second PDF would normally
    // start a second copy of the app. This plugin detects the running copy, hands
    // it the new arguments (the file path) through this callback, and exits the
    // new process. It must be the first plugin registered.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
        let files = opened_files::from_args(app, &args, std::path::Path::new(&cwd));
        opened_files::enqueue(app, files);
        window::focus_main_window(app);
    }));

    builder
        // Native "Open file" dialog.
        .plugin(tauri_plugin_dialog::init())
        // File reading from the frontend (limited by capabilities/default.json + scope).
        .plugin(tauri_plugin_fs::init())
        // Remembers which files were granted to the fs scope across restarts, so files
        // from the "Recent" history can be reopened later. Must come after the fs plugin.
        .plugin(tauri_plugin_persisted_scope::init())
        // Small JSON key-value file in the app data folder (stores the recent files history).
        .plugin(tauri_plugin_store::Builder::default().build())
        // "Show in file manager" (revealItemInDir) for files in Recent.
        .plugin(tauri_plugin_opener::init())
        // Shared state: the queue of files the OS asked us to open.
        .manage(PendingFiles::default())
        // Open documents whose bytes the frontend reads on demand (see document_source.rs).
        .manage(DocumentSources::default())
        // A reload (e.g. Android resuming the app in dev) drops the frontend's open
        // documents without closing them; release their files here.
        .on_page_load(|webview, payload| {
            if payload.event() == PageLoadEvent::Started {
                webview.state::<DocumentSources>().close_all();
            }
        })
        // Rust functions callable from the frontend with `invoke("…")`.
        .invoke_handler(tauri::generate_handler![
            opened_files::take_pending_files,
            open_with::open_with,
            document_source::document_info,
            document_source::open_document,
            document_source::read_document_range,
            document_source::close_document
        ])
        .setup(|_app| {
            // Desktop: a PDF opened from the file manager arrives as a launch argument
            // (`pdf-tormentosa /path/file.pdf`). Queue it so the frontend opens it.
            #[cfg(desktop)]
            {
                let args: Vec<String> = std::env::args().collect();
                let cwd = std::env::current_dir()?;
                let files = opened_files::from_args(_app.handle(), &args, &cwd);
                opened_files::enqueue(_app.handle(), files);
            }
            Ok(())
        })
        // `build` + `run` (instead of a plain `.run`) gives access to the event loop,
        // which is where Android delivers "open this file" requests.
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| opened_files::handle_run_event(app, &event));
}
