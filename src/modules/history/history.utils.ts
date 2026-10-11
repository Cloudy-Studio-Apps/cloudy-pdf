/**
 * History transitions as pure functions (no storage, no React),
 * so the rules are easy to follow and test.
 */
import type { OpenedDocument } from "@/modules/document/document.types";
import { MAX_HISTORY_ENTRIES } from "./history.constants";
import type { HistoryEntry } from "./history.types";

/** Snapshot of an opened document for the history (metadata only). */
export function toHistoryEntry(document: OpenedDocument, openedAt = Date.now()): HistoryEntry {
  return { path: document.path, name: document.name, size: document.data.byteLength, openedAt };
}

/**
 * Puts the entry at the top. Reopening a file moves it to the top instead of
 * duplicating it, and the list is capped at MAX_HISTORY_ENTRIES.
 */
export function addHistoryEntry(entries: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const others = entries.filter((existing) => existing.path !== entry.path);
  return [entry, ...others].slice(0, MAX_HISTORY_ENTRIES);
}

export function removeHistoryEntry(entries: HistoryEntry[], path: string): HistoryEntry[] {
  return entries.filter((entry) => entry.path !== path);
}
