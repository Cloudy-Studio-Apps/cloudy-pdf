//! Merge PDF: joins several PDFs into one, in the order given.
//!
//! Every input is renumbered past the previous one's ids, so all their objects
//! can live in one document. Their pages then go under a single new page tree and
//! catalog; the old catalogs and trees are left unreferenced and pruned.
//! v1 keeps no bookmarks and no form fields of the inputs (their pages and
//! drawings are kept): those live in the catalogs, which can't simply be joined.

use lopdf::{Dictionary, Document, Object, ObjectId, dictionary};
use tauri::{AppHandle, Runtime};

use crate::document_source::blocking;

/// Page attributes a page can inherit from its parents in the page tree. They
/// must be copied onto the page itself, since its new parent won't have them.
const INHERITED: [&[u8]; 4] = [b"Resources", b"MediaBox", b"CropBox", b"Rotate"];

/// Stops the walk up the page tree in a broken file whose parents form a loop.
const MAX_TREE_DEPTH: usize = 64;

/// Writes the merge of `inputs` to `output`; returns the path written.
#[tauri::command]
pub async fn tool_merge<R: Runtime>(
    app: AppHandle<R>,
    inputs: Vec<String>,
    output: String,
) -> Result<Vec<String>, String> {
    if inputs.len() < 2 {
        return Err("Pick at least two PDFs to merge.".into());
    }
    blocking(move || {
        let documents = inputs
            .iter()
            .map(|path| super::load(&app, path))
            .collect::<Result<Vec<_>, _>>()?;
        let mut merged = merge(documents)?;
        super::save(&app, &mut merged, &output)?;
        Ok(vec![output])
    })
    .await
}

fn merge(documents: Vec<Document>) -> Result<Document, String> {
    let version = documents.iter().map(|document| document.version.clone()).max().unwrap_or_default();
    let mut merged = Document::with_version(version);
    let mut next_id = 1;
    // In page order: lopdf's own example orders pages by object id, which isn't page order.
    let mut pages: Vec<ObjectId> = Vec::new();

    for mut document in documents {
        document.renumber_objects_with(next_id);
        next_id = document.max_id + 1;

        for page_id in document.get_pages().into_values() {
            let inherited = inherited_attributes(&document, page_id);
            if let Ok(page) = document.get_object_mut(page_id).and_then(Object::as_dict_mut) {
                for (key, value) in inherited {
                    page.set(key, value);
                }
            }
            pages.push(page_id);
        }
        merged.objects.extend(document.objects);
    }

    merged.max_id = next_id - 1;
    let pages_id = merged.new_object_id();
    for page_id in &pages {
        let page = merged
            .get_object_mut(*page_id)
            .and_then(Object::as_dict_mut)
            .map_err(|error| error.to_string())?;
        page.set("Parent", pages_id);
    }
    merged.objects.insert(
        pages_id,
        Object::Dictionary(dictionary! {
            "Type" => "Pages",
            "Count" => pages.len() as i64,
            "Kids" => pages.iter().copied().map(Object::Reference).collect::<Vec<_>>(),
        }),
    );
    let catalog_id = merged.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    merged.trailer.set("Root", catalog_id);

    // Drops the inputs' old catalogs, page trees, outlines and form dictionaries.
    merged.prune_objects();
    merged.renumber_objects();
    Ok(merged)
}

/// The inheritable attributes a page lacks but one of its ancestors defines
/// (the nearest ancestor wins, as in the PDF spec).
fn inherited_attributes(document: &Document, page_id: ObjectId) -> Vec<(Vec<u8>, Object)> {
    let Ok(page) = document.get_dictionary(page_id) else { return Vec::new() };
    let mut missing: Vec<&[u8]> = INHERITED.into_iter().filter(|key| !page.has(key)).collect();
    let mut found = Vec::new();
    let mut parent = parent_of(document, page);

    for _ in 0..MAX_TREE_DEPTH {
        let Some(node) = parent else { break };
        if missing.is_empty() {
            break;
        }
        missing.retain(|key| match node.get(key) {
            Ok(value) => {
                found.push((key.to_vec(), value.clone()));
                false
            }
            Err(_) => true,
        });
        parent = parent_of(document, node);
    }
    found
}

fn parent_of<'a>(document: &'a Document, node: &Dictionary) -> Option<&'a Dictionary> {
    let id = node.get(b"Parent").and_then(Object::as_reference).ok()?;
    document.get_dictionary(id).ok()
}
