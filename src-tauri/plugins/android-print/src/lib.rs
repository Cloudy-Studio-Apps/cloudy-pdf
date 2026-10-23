//! Android printing for Cloudy PDF: hands a PDF file descriptor to Android's
//! `PrintManager`, which shows the system print dialog. Called from Rust only
//! (no frontend commands); see `src-tauri/src/print.rs` in the app.

use tauri::plugin::{Builder, TauriPlugin};
use tauri::{Manager, Runtime};

mod android;

pub use android::AndroidPrint;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("android-print")
        .setup(|app, api| {
            app.manage(android::init(api)?);
            Ok(())
        })
        .build()
}

/// `app.android_print()` on any AppHandle / window.
pub trait AndroidPrintExt<R: Runtime> {
    fn android_print(&self) -> &AndroidPrint<R>;
}

impl<R: Runtime, T: Manager<R>> AndroidPrintExt<R> for T {
    fn android_print(&self) -> &AndroidPrint<R> {
        self.state::<AndroidPrint<R>>().inner()
    }
}
