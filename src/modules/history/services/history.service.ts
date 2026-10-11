/**
 * Persists the history with the Tauri store plugin: a JSON file in the app's
 * data folder (e.g. ~/.local/share/com.darkredgm.pdftormentosa/history.json).
 * Used instead of localStorage because it's a real file owned by the app,
 * shared between dev and release builds, and not tied to the webview's cache.
 */
import { LazyStore } from "@tauri-apps/plugin-store";
import { HISTORY_STORE_FILE, HISTORY_STORE_KEY } from "../history.constants";
import type { HistoryEntry } from "../history.types";

// LazyStore only reads the file on first use, so importing this module costs nothing.
const store = new LazyStore(HISTORY_STORE_FILE, { defaults: {}, autoSave: false });

export async function loadHistory(): Promise<HistoryEntry[]> {
  return (await store.get<HistoryEntry[]>(HISTORY_STORE_KEY)) ?? [];
}

export async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  await store.set(HISTORY_STORE_KEY, entries);
  // autoSave is off, so write to disk explicitly; one write per change.
  await store.save();
}
