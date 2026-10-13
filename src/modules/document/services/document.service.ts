/**
 * File access through Tauri. Services hold side effects (OS calls), while hooks
 * hold React state, so this code can be reused or tested without React.
 */
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getFileName } from "@/shared/utils/path.utils";
import { DOCUMENT_INFO_COMMAND, SAVE_DOCUMENT_COMMAND, SAVE_PATH_HEADER } from "../document.constants";
import type { DocumentInfo, OpenedDocument } from "../document.types";

const PDF_FILTER = { name: "PDF Documents", extensions: ["pdf"] };

/**
 * Shows the native "Open file" dialog, limited to PDFs.
 * Returns null if the user cancels.
 *
 * Security note: Rust only reads files inside the fs plugin's scope.
 * The dialog plugin automatically adds the picked file to that scope, which is
 * why `readDocument` can open it without broader filesystem permissions.
 */
export async function pickPdfPath(): Promise<string | null> {
  return open({ multiple: false, directory: false, filters: [PDF_FILTER] });
}

/**
 * Checks the file can be opened and wraps it as an OpenedDocument.
 * Nothing is read into memory here: Rust only opens the file and returns its size,
 * so a missing or unreadable file still fails before a tab is created.
 */
export async function readDocument(path: string): Promise<OpenedDocument> {
  const { size } = await invoke<DocumentInfo>(DOCUMENT_INFO_COMMAND, { path });
  return { id: crypto.randomUUID(), name: getFileName(path), path, size };
}

/**
 * Native "Save as" dialog, suggesting `name`. Returns null if the user cancels.
 * Like `open`, the dialog plugin adds the chosen file to the fs scope, which is
 * what allows Rust to write it.
 */
export function pickSavePath(name: string): Promise<string | null> {
  return save({ defaultPath: name, filters: [PDF_FILTER] });
}

/**
 * Writes `bytes` to `path` (Rust: `document_save.rs`) and returns the file's new size.
 * The bytes go as the raw request body; the path in a header, percent-encoded
 * because headers only carry ASCII.
 */
export function writeDocument(path: string, bytes: Uint8Array): Promise<number> {
  return invoke<number>(SAVE_DOCUMENT_COMMAND, bytes, {
    headers: { [SAVE_PATH_HEADER]: encodeURIComponent(path) },
  });
}
