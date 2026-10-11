import { useEffect, useState } from "react";

/**
 * Live width of an element, updated whenever it resizes (window resize, layout change).
 * The viewer uses it to compute the "fit width" zoom.
 *
 * Takes the element itself (not a ref) so the effect re-runs when the element
 * appears; callers get it via a callback ref + useState.
 */
export function useElementWidth(element: HTMLElement | null): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return width;
}
