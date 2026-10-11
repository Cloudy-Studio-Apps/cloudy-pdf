import { useCallback, useEffect, useState } from "react";
import { clamp } from "@/shared/utils/math.utils";
import { CURRENT_PAGE_THRESHOLD } from "../viewer.constants";
import type { PageNavigation } from "../viewer.types";

// Every page element carries `data-page-number` (see PdfPage), which is how
// we find pages in the DOM without keeping a ref for each one.
const PAGE_SELECTOR = "[data-page-number]";

/** The last page whose top edge is above the "current page" line. */
function findCurrentPage(container: HTMLElement): number {
  const marker = container.scrollTop + container.clientHeight * CURRENT_PAGE_THRESHOLD;
  const pages = container.querySelectorAll<HTMLElement>(PAGE_SELECTOR);
  let current = 1;

  for (const page of pages) {
    // Pages are in order, so stop at the first one below the line.
    if (page.offsetTop > marker) break;
    current = Number(page.dataset.pageNumber);
  }
  return current;
}

/** Tracks which page is being read (from the scroll position) and scrolls to a given page. */
export function usePageNavigation(container: HTMLElement | null, pageCount: number): PageNavigation {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!container) return;

    // passive: tells the browser we never call preventDefault, so scrolling stays smooth.
    const onScroll = () => setCurrentPage(findCurrentPage(container));
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [container]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      // Accept anything typed (0, 999, 2.5) and turn it into a valid page.
      const target = clamp(Math.round(pageNumber), 1, pageCount);
      container
        ?.querySelector<HTMLElement>(`[data-page-number="${target}"]`)
        ?.scrollIntoView({ block: "start" });
      setCurrentPage(target);
    },
    [container, pageCount],
  );

  return { currentPage, pageCount, goToPage };
}
