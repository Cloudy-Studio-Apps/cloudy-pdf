import { useEffect, useState } from "react";
import type { ObserveVisibility, VisibilityCallback } from "./hooks.types";

/**
 * One IntersectionObserver shared by many elements (e.g. every page of a PDF).
 *
 * A separate observer per element costs one native observer per page, so a
 * 2,000-page document would create 2,000 of them. A single observer computes all
 * intersections in one pass and routes each entry to its element's callback.
 *
 * Returns null until `root` exists (it usually comes from a callback ref).
 */
export function useVisibilityObserver(
  root: Element | null,
  rootMargin?: string,
): ObserveVisibility | null {
  const [observe, setObserve] = useState<ObserveVisibility | null>(null);

  useEffect(() => {
    if (!root) return;
    const callbacks = new Map<Element, VisibilityCallback>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) callbacks.get(entry.target)?.(entry.isIntersecting);
      },
      { root, rootMargin },
    );

    // Wrapped in an arrow so useState stores the function instead of calling it.
    setObserve(() => (element: Element, onChange: VisibilityCallback) => {
      callbacks.set(element, onChange);
      observer.observe(element);
      return () => {
        callbacks.delete(element);
        observer.unobserve(element);
      };
    });

    return () => {
      observer.disconnect();
      setObserve(null);
    };
  }, [root, rootMargin]);

  return observe;
}
