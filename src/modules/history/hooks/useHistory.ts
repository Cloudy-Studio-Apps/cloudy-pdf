import { useCallback, useEffect, useRef, useState } from "react";
import { loadHistory, saveHistory } from "../services/history.service";
import { addHistoryEntry, removeHistoryEntry } from "../history.utils";
import type { HistoryControl, HistoryEntry } from "../history.types";

/**
 * Recent files: loaded once from disk, then kept in React state.
 * Every change updates the state immediately (the UI never waits for disk)
 * and is then saved in the background.
 */
export function useHistory(): HistoryControl {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  // Prevents saving the initial empty list over the file before it has been loaded.
  const loaded = useRef(false);

  useEffect(() => {
    loadHistory()
      .then((stored) => {
        // Flag first, so the state update below is the first one that gets saved.
        loaded.current = true;
        // Merge instead of replace: a file may have been recorded before loading finished
        // (e.g. the app was launched by double-clicking a PDF). reduceRight adds the
        // oldest first, so the newest ends up on top.
        setEntries((current) => current.reduceRight(addHistoryEntry, stored));
      })
      .catch((error) => {
        loaded.current = true;
        console.error("Failed to load history", error);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    saveHistory(entries).catch((error) => console.error("Failed to save history", error));
  }, [entries]);

  const record = useCallback((entry: HistoryEntry) => {
    setEntries((current) => addHistoryEntry(current, entry));
  }, []);
  const remove = useCallback((path: string) => {
    setEntries((current) => removeHistoryEntry(current, path));
  }, []);
  const clear = useCallback(() => setEntries([]), []);

  return { entries, record, remove, clear };
}
