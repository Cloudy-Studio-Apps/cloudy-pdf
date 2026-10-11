import { useCallback, useLayoutEffect, useRef } from "react";
import type { Point } from "@/shared/hooks/hooks.types";
import type { ScrollAnchor } from "../viewer.types";

/** Top-left corner of the visible area: the anchor for toolbar and keyboard zoom. */
const TOP_LEFT: Point = { x: 0, y: 0 };

/**
 * Keeps the reading position stable when the zoom changes.
 *
 * Without this, zooming from 100% to 200% doubles the content height but keeps
 * the same scrollTop, so you'd jump to a page halfway back. Scaling the scroll
 * position by the same ratio keeps roughly the same spot on screen. (Approximate:
 * gaps and padding between pages don't scale, which is close enough for reading.)
 *
 * By default the top-left of the visible area stays put. `setAnchor` picks another
 * point for the next zoom change only: Ctrl+wheel passes the pointer position,
 * so the content under the cursor stays under the cursor (like Acrobat).
 *
 * useLayoutEffect runs before the browser paints, so the jump is never visible.
 */
export function useScrollAnchor(container: HTMLElement | null, scale: number): ScrollAnchor {
  const previousScale = useRef(scale);
  // Point inside the container (px from its top-left) that must not move.
  const anchor = useRef<Point>(TOP_LEFT);

  useLayoutEffect(() => {
    if (!container || previousScale.current === scale) return;

    const ratio = scale / previousScale.current;
    const { x, y } = anchor.current;
    // The content point under the anchor is (scroll + anchor); after scaling it is
    // that times `ratio`, so scroll back by the anchor's offset to keep it there.
    container.scrollTop = (container.scrollTop + y) * ratio - y;
    container.scrollLeft = (container.scrollLeft + x) * ratio - x;
    previousScale.current = scale;
    anchor.current = TOP_LEFT;
  }, [container, scale]);

  const setAnchor = useCallback((point: Point) => {
    anchor.current = point;
  }, []);

  return { setAnchor };
}
