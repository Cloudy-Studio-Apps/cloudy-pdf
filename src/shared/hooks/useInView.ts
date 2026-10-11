import { useEffect, useState, type RefObject } from "react";

/**
 * True while the element intersects its scroll container (plus `rootMargin`).
 *
 * The viewer uses it for lazy rendering: only pages near the screen get a
 * canvas, so a 500-page PDF doesn't render 500 canvases at once.
 */
export function useInView(
  ref: RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {},
): boolean {
  const [inView, setInView] = useState(false);
  // Destructured so the effect depends on the values, not on a new options object each render.
  const { root, rootMargin, threshold } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root, rootMargin, threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, root, rootMargin, threshold]);

  return inView;
}
