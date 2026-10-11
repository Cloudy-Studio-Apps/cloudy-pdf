/**
 * The history module remembers recently opened files ("Recent" on the Home page).
 * Only metadata is stored, never the file contents.
 */

export interface HistoryEntry {
  /** Absolute path (desktop) or `content://` URI (Android). Unique key of an entry. */
  path: string;
  name: string;
  /** File size in bytes when it was last opened. */
  size: number;
  /** Last time it was opened (ms since epoch). */
  openedAt: number;
}

/** Everything the UI needs to show and edit the history (returned by useHistory). */
export interface HistoryControl {
  entries: HistoryEntry[];
  record: (entry: HistoryEntry) => void;
  remove: (path: string) => void;
  clear: () => void;
}
