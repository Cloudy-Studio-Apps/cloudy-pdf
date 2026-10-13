/**
 * The search module finds text in a document: it scans the pages in the
 * background, reports matches as character ranges of each page's text items,
 * and renders the find bar. Highlighting is done by the viewer.
 */
export interface SearchOptions {
  matchCase: boolean;
  wholeWords: boolean;
}

/** A page's text as one string, and where each text item starts in it. */
export interface PageText {
  text: string;
  itemStarts: number[];
  itemLengths: number[];
}

/** Characters [start, end) of text item `itemIndex`. */
export interface TextRange {
  itemIndex: number;
  start: number;
  end: number;
}

/** One match. `id` is unique across searches (`"<search>:<n>"`). A match can span several items. */
export interface SearchMatch {
  id: string;
  pageNumber: number;
  ranges: TextRange[];
}

export type SearchStatus = "idle" | "searching" | "done" | "error";

export interface SearchResult {
  matches: SearchMatch[];
  /** Index of the selected match, or -1 when there's none. */
  currentIndex: number;
  status: SearchStatus;
  error: string | null;
}

/** Returned by useDocumentSearch. */
export interface DocumentSearch extends SearchResult {
  isOpen: boolean;
  /** Increases every time the find bar is asked to focus its input (e.g. Ctrl+F again). */
  focusRequest: number;
  query: string;
  options: SearchOptions;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  toggleOption: (option: keyof SearchOptions) => void;
  next: () => void;
  previous: () => void;
}

export interface FindBarProps {
  search: DocumentSearch;
}
