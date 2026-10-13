import type { SearchOptions, SearchResult } from "./search.types";

/** Wait this long after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 250;

/** While scanning, matches are handed to React at most this often (one render per page would be too many). */
export const FLUSH_INTERVAL_MS = 100;

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = { matchCase: false, wholeWords: false };

export const EMPTY_SEARCH_RESULT: SearchResult = { matches: [], currentIndex: -1, status: "idle", error: null };
