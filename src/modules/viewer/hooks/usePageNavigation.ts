import { useCallback, useEffect, useState } from "react";
import { clamp } from "@/shared/utils/math.utils";
import { CURRENT_PAGE_THRESHOLD } from "../viewer.constants";
import { findPageAt, getPageElement } from "../viewer.utils";
import type { PageNavigation } from "../viewer.types";

/** The page whose top edge has passed the "current page" line. */
function findCurrentPage(container: HTMLElement): number {
  const marker = container.scrollTop + container.clientHeight * CURRENT_PAGE_THRESHOLD;
  const page = findPageAt(container, marker);
  return page ? Number(page.dataset.pageNumber) : 1;
}

/** Tracks which page is being read (from the scroll position) and scrolls to a given page. */
export function usePageNavigation(container: HTMLElement | null, pageCount: number): PageNavigation {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!container) return;

    // Scroll events can fire several times per frame; measuring once per frame is enough.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCurrentPage(findCurrentPage(container));
      });
    };

    // passive: tells the browser we never call preventDefault, so scrolling stays smooth.
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [container]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      // Accept anything typed (0, 999, 2.5) and turn it into a valid page.
      const target = clamp(Math.round(pageNumber), 1, pageCount);
      if (container) getPageElement(container, target)?.scrollIntoView({ block: "start" });
      setCurrentPage(target);
    },
    [container, pageCount],
  );

  return { currentPage, pageCount, goToPage };
}
