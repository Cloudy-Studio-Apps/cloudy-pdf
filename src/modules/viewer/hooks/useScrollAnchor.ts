import { useLayoutEffect, useRef } from "react";

/**
 * Keeps the reading position stable when the zoom changes.
 *
 * Without this, zooming from 100% to 200% doubles the content height but keeps
 * the same scrollTop, so you'd jump to a page halfway back. Scaling scrollTop by
 * the same ratio keeps roughly the same spot on screen. (Approximate: gaps and
 * padding between pages don't scale, which is close enough for reading.)
 *
 * useLayoutEffect runs before the browser paints, so the jump is never visible.
 */
export function useScrollAnchor(container: HTMLElement | null, scale: number): void {
  const previousScale = useRef(scale);

  useLayoutEffect(() => {
    if (!container || previousScale.current === scale) return;

    const ratio = scale / previousScale.current;
    container.scrollTop = container.scrollTop * ratio;
    container.scrollLeft = container.scrollLeft * ratio;
    previousScale.current = scale;
  }, [container, scale]);
}
