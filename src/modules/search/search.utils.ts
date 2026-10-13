/** Search rules as pure functions: building page text, matching, mapping matches to text items. */
import type { PdfTextItem } from "@/modules/pdf/pdf.types";
import type { PageText, SearchMatch, SearchOptions, SearchResult, TextRange } from "./search.types";

/** Letters, digits and underscore in any script: what "whole words" treats as part of a word. */
const WORD_CHARACTER = /[\p{L}\p{N}_]/u;

/**
 * Joins a page's text items into one searchable string. An item that ends a line
 * adds a space, so the last word of a line and the first of the next don't merge.
 */
export function buildPageText(items: readonly PdfTextItem[]): PageText {
  let text = "";
  const itemStarts: number[] = [];
  const itemLengths: number[] = [];
  for (const item of items) {
    itemStarts.push(text.length);
    itemLengths.push(item.str.length);
    text += item.str;
    if (item.hasEOL) text += " ";
  }
  return { text, itemStarts, itemLengths };
}

/**
 * Lowercases one UTF-16 unit at a time, keeping the length unchanged so offsets in
 * the result are offsets in the original (`"İ".toLowerCase()` is 2 characters long).
 */
export function foldCase(text: string): string {
  let folded = "";
  for (let index = 0; index < text.length; index++) {
    const lower = text[index].toLowerCase();
    folded += lower.length === 1 ? lower : text[index];
  }
  return folded;
}

/** Non-overlapping [start, end) offsets of `query` in `text`. */
export function findMatches(text: string, query: string, options: SearchOptions): Array<[number, number]> {
  if (!query) return [];
  const haystack = options.matchCase ? text : foldCase(text);
  const needle = options.matchCase ? query : foldCase(query);
  const matches: Array<[number, number]> = [];

  for (let start = haystack.indexOf(needle); start !== -1; start = haystack.indexOf(needle, start + needle.length)) {
    const end = start + needle.length;
    const isWholeWord = !WORD_CHARACTER.test(haystack[start - 1] ?? "") && !WORD_CHARACTER.test(haystack[end] ?? "");
    if (!options.wholeWords || isWholeWord) matches.push([start, end]);
  }
  return matches;
}

/** Index of the last item starting at or before `offset` (binary search: starts are sorted). */
function itemAt(itemStarts: readonly number[], offset: number): number {
  let low = 0;
  let high = itemStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (itemStarts[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** The character ranges of the text items covered by page offsets [start, end). Separators are skipped. */
export function toTextRanges(page: PageText, start: number, end: number): TextRange[] {
  const ranges: TextRange[] = [];
  for (let index = itemAt(page.itemStarts, start); index < page.itemStarts.length; index++) {
    const itemStart = page.itemStarts[index];
    if (itemStart >= end) break;
    const from = Math.max(start, itemStart) - itemStart;
    const to = Math.min(end, itemStart + page.itemLengths[index]) - itemStart;
    if (to > from) ranges.push({ itemIndex: index, start: from, end: to });
  }
  return ranges;
}

/** Adds a batch of matches; the first match ever found becomes the current one. */
export function appendMatches(result: SearchResult, batch: SearchMatch[]): SearchResult {
  if (batch.length === 0) return result;
  return { ...result, matches: [...result.matches, ...batch], currentIndex: Math.max(result.currentIndex, 0) };
}

/** Moves the current match by `delta`, wrapping around at both ends. */
export function stepMatch(result: SearchResult, delta: number): SearchResult {
  const count = result.matches.length;
  if (count === 0) return result;
  return { ...result, currentIndex: (result.currentIndex + delta + count) % count };
}

/** The find bar's count: "3 of 41", "3 of 41…" while scanning, "No results", "Searching…". */
export function describeResult(result: SearchResult): string {
  const count = result.matches.length;
  if (result.status === "error") return "Search failed";
  if (result.status === "idle") return "";
  if (count === 0) return result.status === "searching" ? "Searching…" : "No results";
  return `${result.currentIndex + 1} of ${count}${result.status === "searching" ? "…" : ""}`;
}
