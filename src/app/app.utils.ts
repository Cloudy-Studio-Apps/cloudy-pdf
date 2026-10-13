/** Pure helpers of the app shell: data handed from one module to another. */
import type { SearchMatch } from "@/modules/search/search.types";
import type { HighlightsByPage, PageHighlight } from "@/modules/viewer/viewer.types";

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
