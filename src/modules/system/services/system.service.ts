import { invoke } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { OPEN_WITH_COMMAND } from "../system.constants";

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
