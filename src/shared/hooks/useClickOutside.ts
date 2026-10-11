import { useEffect, type RefObject } from "react";

/**
 * Calls `onOutside` when the user presses anywhere outside `ref`.
 * Used to close open menus. `enabled` avoids keeping a global listener
 * while nothing is open.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    // pointerdown (not click) closes the menu immediately, like native menus do.
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onOutside();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [ref, onOutside, enabled]);
}
