/**
 * Names shared with the Rust backend. They are plain strings on both sides,
 * so if one changes the other must change too.
 */

/** Must match `FILES_PENDING_EVENT` in `src-tauri/src/opened_files.rs`. */
export const FILES_PENDING_EVENT = "opened-files://pending";

/** Must match the `take_pending_files` command in `src-tauri/src/opened_files.rs`. */
export const TAKE_PENDING_FILES_COMMAND = "take_pending_files";

/** Must match the `document_info` command in `src-tauri/src/document_source.rs`. */
export const DOCUMENT_INFO_COMMAND = "document_info";

/** Must match the `save_document` command in `src-tauri/src/document_save.rs`. */
export const SAVE_DOCUMENT_COMMAND = "save_document";

/** Carries the destination of `save_document` (percent-encoded). Must match `PATH_HEADER` in Rust. */
export const SAVE_PATH_HEADER = "x-document-path";
