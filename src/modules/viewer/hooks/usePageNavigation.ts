import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { clamp } from "@/shared/utils/math.utils";
import { CURRENT_PAGE_THRESHOLD } from "../viewer.constants";
import { findPageAt, getPageElement, isOnScreen } from "../viewer.utils";
import type { PageNavigation, ScrollRequest } from "../viewer.types";

/** The page whose top edge has passed the "current page" line. */
function findCurrentPage(container: HTMLElement): number {
  const marker = container.scrollTop + container.clientHeight * CURRENT_PAGE_THRESHOLD;
  const page = findPageAt(container, marker);
  return page ? Number(page.dataset.pageNumber) : 1;
}

/**
 * Tracks which page is being read (from the scroll position) and scrolls to pages.
 *
 * Scrolling is applied in a layout effect after React has rendered, because the
 * target page may not exist yet: in single page display, only the current page
 * is in the DOM, so going to page 7 first renders page 7, then scrolls to it.
 *
 * Page offsets (`offsetTop`) are relative to ViewerPages' `relative` wrapper, which
 * sits at the scroll area's top-left, so they're positions in the scroll content.
 */
export function usePageNavigation(container: HTMLElement | null, pageCount: number): PageNavigation {
  const [currentPage, setCurrentPage] = useState(1);
  // A new object on every call, so going to the page you're already on still scrolls.
  const [request, setRequest] = useState<ScrollRequest | null>(null);

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

  useLayoutEffect(() => {
    if (!container || !request) return;
    const page = getPageElement(container, request.pageNumber);
    if (page) container.scrollTop = page.offsetTop + request.topRatio * page.offsetHeight;
  }, [container, request]);

  const goToPage = useCallback(
    (pageNumber: number, topRatio = 0) => {
      // Accept anything typed (0, 999, 2.5) and turn it into a valid page.
      const target = clamp(Math.round(pageNumber), 1, pageCount);
      setCurrentPage(target);
      setRequest({ pageNumber: target, topRatio });
    },
    [pageCount],
  );

  const showPage = useCallback(
    (pageNumber: number) => {
      const page = container && getPageElement(container, pageNumber);
      if (!page || !container || !isOnScreen(container, page)) goToPage(pageNumber);
    },
    [container, goToPage],
  );

  return { currentPage, pageCount, goToPage, showPage };
}
