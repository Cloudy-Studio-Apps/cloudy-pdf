/**
 * File access through Tauri. Services hold side effects (OS calls), while hooks
 * hold React state, so this code can be reused or tested without React.
 */
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { getFileName } from "@/shared/utils/path.utils";
import type { OpenedDocument } from "../document.types";

const PDF_FILTER = { name: "PDF Documents", extensions: ["pdf"] };

/**
 * Shows the native "Open file" dialog, limited to PDFs.
 * Returns null if the user cancels.
 *
 * Security note: Tauri only lets the frontend read files inside its "fs scope".
 * The dialog plugin automatically adds the picked file to that scope, which is
 * why `readDocument` can read it without broader filesystem permissions.
 */
export async function pickPdfPath(): Promise<string | null> {
  return open({ multiple: false, directory: false, filters: [PDF_FILTER] });
}

/** Reads the whole file into memory and wraps it as an OpenedDocument. */
export async function readDocument(path: string): Promise<OpenedDocument> {
  const data = await readFile(path);
  return { id: crypto.randomUUID(), name: getFileName(path), path, data };
}
