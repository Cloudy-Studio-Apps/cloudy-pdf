//! "Print": hands the original PDF to the system's print dialog.
//!
//! Printing the file itself (not a rendering of it) keeps vector quality and lets
//! the OS dialog handle printers, page ranges and copies, even for huge files.
//! - Linux: XDG Desktop Portal `org.freedesktop.portal.Print` (via `ashpd`), the
//!   same desktop-agnostic approach as "Open with…".
//! - Android: `PrintManager`, through the local `tauri-plugin-android-print` crate.

use std::fs::File;

use tauri::{AppHandle, Runtime};

use crate::document_source::open_file;

/// Command called from the frontend; `title` names the print job.
#[tauri::command]
pub async fn print_document<R: Runtime>(app: AppHandle<R>, path: String, title: String) -> Result<(), String> {
    // Same opening path as viewing: scope check, and on Android the descriptor
    // kept from the "Open with…" grant (which may have been revoked since).
    let opener = app.clone();
    let file = tauri::async_runtime::spawn_blocking(move || open_file(&opener, &path))
        .await
        .map_err(|error| error.to_string())??;
    print_file(&app, file, &title).await
}

#[cfg(target_os = "linux")]
async fn print_file<R: Runtime>(_app: &AppHandle<R>, file: File, title: &str) -> Result<(), String> {
    use std::os::fd::AsFd;

    use ashpd::desktop::ResponseError;
    use ashpd::desktop::print::{PreparePrintOptions, PrintOptions, PrintProxy};

    let result: ashpd::Result<()> = async {
        let proxy = PrintProxy::new().await?;
        // Step 1: the native dialog (printer, pages, copies). Step 2: send the file.
        let prepared = proxy
            .prepare_print(
                None,
                title,
                Default::default(),
                Default::default(),
                PreparePrintOptions::default().set_modal(true),
            )
            .await?
            .response()?;
        proxy
            .print(
                None,
                title,
                &file.as_fd(),
                PrintOptions::default().set_token(prepared.token).set_modal(true),
            )
            .await?
            .response()
    }
    .await;

    match result {
        Ok(()) => Ok(()),
        // Closing the dialog without printing is not an error.
        Err(ashpd::Error::Response(ResponseError::Cancelled)) => Ok(()),
        Err(error) => Err(format!("Could not print: {error}")),
    }
}

#[cfg(target_os = "android")]
async fn print_file<R: Runtime>(app: &AppHandle<R>, file: File, title: &str) -> Result<(), String> {
    use std::os::fd::IntoRawFd;

    use tauri_plugin_android_print::AndroidPrintExt;

    // Kotlin adopts the descriptor and closes it when the print job ends.
    app.android_print().print(file.into_raw_fd(), title)
}

#[cfg(not(any(target_os = "linux", target_os = "android")))]
async fn print_file<R: Runtime>(_app: &AppHandle<R>, _file: File, _title: &str) -> Result<(), String> {
    Err("Printing is not supported on this platform yet.".into())
}
