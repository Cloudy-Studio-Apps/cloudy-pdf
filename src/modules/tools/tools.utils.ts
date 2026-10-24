/**
 * Tool rules as pure functions: finding a tool, page ranges, input lists and
 * output names. No React or Tauri here; the hooks call these.
 */
import { getFileName } from "@/shared/utils/path.utils";
import { TOOL_CATEGORIES } from "./tools.constants";
import type { PageRange, PageRangesResult, SplitMode, SplitPart, ToolEntry, ToolInputFile } from "./tools.types";

/** A tool of the catalog by id, with its category's color. */
export function findTool(toolId: string): ToolEntry | null {
  for (const category of TOOL_CATEGORIES) {
    const tool = category.tools.find((candidate) => candidate.id === toolId);
    if (tool) return { tool, color: category.color };
  }
  return null;
}

/**
 * Parses "1-3, 5, 8-" into ranges, checked against the page count.
 * "8-" runs to the last page and "-3" starts at the first.
 */
export function parsePageRanges(text: string, pageCount: number): PageRangesResult {
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return { error: "Enter the pages to keep, e.g. 1-3, 5." };

  const ranges: PageRange[] = [];
  for (const part of parts) {
    const match = /^(\d*)\s*(-?)\s*(\d*)$/.exec(part);
    // A lone "-" or something that isn't numbers and a dash.
    if (!match || (!match[1] && !match[3])) return { error: `"${part}" isn't a page or a range.` };

    const isRange = match[2] === "-";
    const first = match[1] ? Number(match[1]) : 1;
    const last = match[3] ? Number(match[3]) : isRange ? pageCount : first;
    if (first < 1 || last > pageCount) return { error: `Pages go from 1 to ${pageCount}.` };
    if (first > last) return { error: `"${part}" goes backwards.` };
    ranges.push([first, last]);
  }
  return { ranges };
}

/** "1-3_5" style label of ranges, for file names. */
export function formatPageRanges(ranges: PageRange[]): string {
  return ranges.map(([first, last]) => (first === last ? `${first}` : `${first}-${last}`)).join("_");
}

/** "report.pdf" + "merged" → "report-merged.pdf". */
export function outputName(inputName: string, suffix: string): string {
  return `${inputName.replace(/\.pdf$/i, "")}-${suffix}.pdf`;
}

/** Wraps picked paths as input files. */
export function toInputFiles(paths: string[]): ToolInputFile[] {
  return paths.map((path) => ({ id: crypto.randomUUID(), path, name: getFileName(path) }));
}

/** Moves the item with `id` by `offset` places; unchanged at the ends. */
export function moveItem<T extends { id: string }>(items: T[], id: string, offset: number): T[] {
  const from = items.findIndex((item) => item.id === id);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= items.length) return items;

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** True for the modes that write several files into a folder. */
export function writesToFolder(mode: SplitMode): boolean {
  return mode !== "extract";
}

/**
 * The output files of a split into `folder`: one per range, or one per page,
 * named after the input ("report-1-3.pdf"). Existing files with those names are replaced.
 */
export function splitParts(
  mode: SplitMode,
  ranges: PageRange[],
  pageCount: number,
  inputName: string,
  folder: string,
): SplitPart[] {
  const outputRanges: PageRange[] =
    mode === "each-page" ? Array.from({ length: pageCount }, (_, index) => [index + 1, index + 1]) : ranges;
  return outputRanges.map((range) => ({
    ranges: [range],
    output: `${folder}/${outputName(inputName, formatPageRanges([range]))}`,
  }));
}
