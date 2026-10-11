import { useLayoutEffect, useRef } from "react";

/** Keeps the reading position (as a scroll ratio) stable when the content is rescaled. */
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
