import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { OPEN_WITH_COMMAND, PRINT_COMMAND } from "../system.constants";

/**
 * Opens the system file manager with the file highlighted
 * (on Linux through the standard FileManager1 D-Bus interface: Dolphin, Nautilus…).
 */
export function revealInFileManager(path: string): Promise<void> {
  return revealItemInDir(path);
}

/** Shows the native "Open with…" chooser (implemented in Rust: `open_with.rs`). */
export function openWithChooser(path: string): Promise<void> {
  return invoke(OPEN_WITH_COMMAND, { path });
}

/** Native print dialog for the original PDF (Rust: `print.rs`). Cancelling resolves normally. */
export function printDocument(path: string, title: string): Promise<void> {
  return invoke(PRINT_COMMAND, { path, title });
}
