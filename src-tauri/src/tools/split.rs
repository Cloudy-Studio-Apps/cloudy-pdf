//! Split / Extract pages: writes chosen pages of one PDF into new files.
//!
//! One command covers both tools: Extract sends a single part (every range into
//! one file), Split sends one part per range. Output paths are chosen by the
//! frontend (a "Save as" file, or names inside a picked folder).

use serde::Deserialize;
use tauri::{AppHandle, Runtime};

use crate::document_source::blocking;

/// One output file: the pages it keeps (1-based, inclusive ranges) and where it goes.
#[derive(Deserialize)]
pub struct SplitPart {
    ranges: Vec<(u32, u32)>,
    output: String,
}

/// Writes each part and returns the paths written, in order.
#[tauri::command]
pub async fn tool_split<R: Runtime>(
    app: AppHandle<R>,
    input: String,
    parts: Vec<SplitPart>,
) -> Result<Vec<String>, String> {
    blocking(move || {
        let source = super::load(&app, &input)?;
        let page_count = source.get_pages().len() as u32;

        parts
            .into_iter()
            .map(|part| {
                let mut document = source.clone();
                // Pages keep their original order, whatever the order of the ranges.
                let removed: Vec<u32> = (1..=page_count)
                    .filter(|page| !part.ranges.iter().any(|(first, last)| (first..=last).contains(&page)))
                    .collect();
                if removed.len() as u32 == page_count {
                    return Err("No pages selected.".to_string());
                }
                document.delete_pages(&removed);
                drop_page_references(&mut document);
                document.prune_objects();
                super::save(&app, &mut document, &part.output)?;
                Ok(part.output)
            })
            .collect()
    })
    .await
}

/// Bookmarks and page labels describe the original page list, and would point at
/// deleted pages (or number the kept ones wrongly), so the new file has none.
fn drop_page_references(document: &mut lopdf::Document) {
    if let Ok(catalog) = document.catalog_mut() {
        catalog.remove(b"Outlines");
        catalog.remove(b"PageLabels");
    }
}
