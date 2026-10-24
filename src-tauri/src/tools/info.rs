//! What the tools need to know about an input before running (its page count).

use tauri::{AppHandle, Runtime};

use crate::document_source::blocking;

/// Number of pages of a PDF, e.g. to check the page ranges of Split.
#[tauri::command]
pub async fn tool_page_count<R: Runtime>(app: AppHandle<R>, path: String) -> Result<u32, String> {
    blocking(move || {
        let document = super::load(&app, &path)?;
        Ok(document.get_pages().len() as u32)
    })
    .await
}
