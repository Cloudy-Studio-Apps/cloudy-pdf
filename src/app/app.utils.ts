/** Pure helpers of the app shell: data handed from one module to another. */
import type { AnnotationMode } from "@/modules/annotations/annotations.types";
import type { SearchMatch } from "@/modules/search/search.types";
import type { HighlightsByPage, PageHighlight, ViewerTool } from "@/modules/viewer/viewer.types";

/** Search matches (search module) → highlights per page (viewer module). */
export function groupHighlights(matches: readonly SearchMatch[], currentIndex: number): HighlightsByPage {
  const byPage = new Map<number, PageHighlight[]>();
  matches.forEach((match, index) => {
    const list = byPage.get(match.pageNumber) ?? [];
    list.push({ id: match.id, ranges: match.ranges, current: index === currentIndex });
    byPage.set(match.pageNumber, list);
  });
  return byPage;
}

/**
 * How annotations react to the pointer for each viewer tool: Draw draws, Select
 * picks strokes (text selection still works around them), Hand leaves them alone.
 */
export function toAnnotationMode(tool: ViewerTool): AnnotationMode {
  if (tool === "draw") return "draw";
  return tool === "select" ? "select" : "off";
}
