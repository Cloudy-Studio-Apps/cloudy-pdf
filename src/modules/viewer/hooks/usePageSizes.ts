import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { PageSize } from "@/modules/pdf/pdf.types";
import { findPageAt, getPageElement, isSameSize } from "../viewer.utils";
import type { PageSizes } from "../viewer.types";

/** The page at the top of the screen and how far its top edge is from the scroll position. */
interface TopPage {
  pageNumber: number;
  offset: number;
}

/**
 * Size of every page, learned lazily.
 *
 * All pages start with page 1's size (right for almost every PDF), and each page
 * reports its real size the first time it renders. When a size does change, the
 * page at the top of the screen is pinned in place, so a page above it growing or
 * shrinking never makes the text you're reading jump.
 */
export function usePageSizes(
  pageCount: number,
  defaultSize: PageSize,
  container: HTMLElement | null,
): PageSizes {
  const [sizes, setSizes] = useState<PageSize[]>(() => Array(pageCount).fill(defaultSize));
  // Latest sizes, so reportSize can skip unchanged pages without depending on state.
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;
  // Captured before the first size change of a batch, while the DOM still shows the old layout.
  const topPage = useRef<TopPage | null>(null);

  const reportSize = useCallback(
    (pageNumber: number, size: PageSize) => {
      if (isSameSize(sizesRef.current[pageNumber - 1], size)) return;

      if (container && !topPage.current) {
        const page = findPageAt(container, container.scrollTop);
        if (page) {
          topPage.current = {
            pageNumber: Number(page.dataset.pageNumber),
            offset: page.offsetTop - container.scrollTop,
          };
        }
      }
      setSizes((current) => {
        const next = [...current];
        next[pageNumber - 1] = size;
        return next;
      });
    },
    [container],
  );

  // Runs after React applied the new sizes but before paint, so the correction is never visible.
  useLayoutEffect(() => {
    const pinned = topPage.current;
    topPage.current = null;
    if (!container || !pinned) return;
    const page = getPageElement(container, pinned.pageNumber);
    if (page) container.scrollTop = page.offsetTop - pinned.offset;
  }, [sizes, container]);

  return { sizes, reportSize };
}
