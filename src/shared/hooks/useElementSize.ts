import { useEffect, useState } from "react";
import type { ElementSize } from "./hooks.types";

const UNMEASURED: ElementSize = { width: 0, height: 0 };

/**
 * Live size of an element, updated whenever it resizes (window resize, panel
 * opened…). The viewer uses it for the fit-width and fit-page zoom.
 *
 * Takes the element itself (not a ref) so the effect re-runs when the element
 * appears; callers get it via a callback ref + useState.
 */
export function useElementSize(element: HTMLElement | null): ElementSize {
  const [size, setSize] = useState<ElementSize>(UNMEASURED);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return size;
}
