import { useEffect, useState, type RefObject } from "react";
import type { ObserveVisibility } from "./hooks.types";

/**
 * True while the element is inside the area watched by `observe`
 * (a shared observer from useVisibilityObserver). False while `observe` is null.
 */
export function useIsVisible(ref: RefObject<Element | null>, observe: ObserveVisibility | null): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !observe) return;
    const stop = observe(element, setVisible);
    return () => {
      stop();
      setVisible(false);
    };
  }, [ref, observe]);

  return visible;
}
