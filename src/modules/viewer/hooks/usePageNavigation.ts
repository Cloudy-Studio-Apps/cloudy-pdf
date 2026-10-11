import { useCallback, useEffect, useState } from "react";
import { clamp } from "@/shared/utils/math.utils";
import { CURRENT_PAGE_THRESHOLD } from "../viewer.constants";
import type { PageNavigation } from "../viewer.types";

const PAGE_SELECTOR = "[data-page-number]";

function findCurrentPage(container: HTMLElement): number {
  const marker = container.scrollTop + container.clientHeight * CURRENT_PAGE_THRESHOLD;
  const pages = container.querySelectorAll<HTMLElement>(PAGE_SELECTOR);
  let current = 1;

  for (const page of pages) {
    if (page.offsetTop > marker) break;
    current = Number(page.dataset.pageNumber);
  }
  return current;
}

export function usePageNavigation(container: HTMLElement | null, pageCount: number): PageNavigation {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!container) return;

    const onScroll = () => setCurrentPage(findCurrentPage(container));
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [container]);

  const goToPage = useCallback(
    (pageNumber: number) => {
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
