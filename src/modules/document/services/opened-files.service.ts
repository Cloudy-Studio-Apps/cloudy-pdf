/**
 * Bridge to the Rust side for files the OS asks us to open
 * (double-click on a PDF, "Open with…", app set as the default PDF reader).
 *
 * Rust can't push the file into React directly, and at launch the file may arrive
 * before React is listening. So Rust keeps a queue and only sends a "something is
 * pending" signal; the frontend then takes the queue whenever it's ready.
 * See `src-tauri/src/opened_files.rs`.
 */
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { FILES_PENDING_EVENT, TAKE_PENDING_FILES_COMMAND } from "../document.constants";

/** Takes (and empties) the queue of files waiting to be opened. */
export function takePendingFiles(): Promise<string[]> {
  return invoke<string[]>(TAKE_PENDING_FILES_COMMAND);
}

/** Subscribes to "new files are pending". Resolves to a function that unsubscribes. */
export function onFilesPending(callback: () => void): Promise<UnlistenFn> {
  return listen(FILES_PENDING_EVENT, callback);
}
