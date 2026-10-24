/**
 * Native file dialogs, limited to PDFs. Shared by opening, saving and the tools.
 *
 * Security note: Rust only reads and writes files inside the fs plugin's scope.
 * The dialog plugin adds every picked file (or folder) to that scope, which is
 * what lets Rust use it without broader filesystem permissions.
 * Each function returns null when the user cancels.
 */
import { open, save } from "@tauri-apps/plugin-dialog";

const PDF_FILTER = { name: "PDF Documents", extensions: ["pdf"] };

/** "Open file" dialog for one PDF. */
export function pickPdfPath(): Promise<string | null> {
  return open({ multiple: false, directory: false, filters: [PDF_FILTER] });
}

/** "Open file" dialog for several PDFs at once. */
export function pickPdfPaths(): Promise<string[] | null> {
  return open({ multiple: true, directory: false, filters: [PDF_FILTER] });
}

/** "Save as" dialog, suggesting `name`. */
export function pickSavePath(name: string): Promise<string | null> {
  return save({ defaultPath: name, filters: [PDF_FILTER] });
}

/**
 * Folder picker (desktop only: Android's dialog can't pick folders). The folder
 * itself is added to the scope, not its subfolders, so files go directly inside it.
 */
export function pickFolder(): Promise<string | null> {
  return open({ directory: true, multiple: false, recursive: false });
}
