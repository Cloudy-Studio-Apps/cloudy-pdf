import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { clamp } from "@/shared/utils/math.utils";
import { MenuList } from "./MenuList";
import type { ContextMenuProps, MenuPosition } from "../menu.types";

/** Minimum distance between the menu and the window edges, in px. */
const VIEWPORT_MARGIN = 8;

/**
 * Right-click menu shown at the cursor. Closes on outside click, Escape,
 * scroll, window resize or when the window loses focus, like native menus.
 *
 * Rendered in a portal (directly under <body>) so no parent's overflow or
 * stacking can clip it or hide it behind other content.
 */
export function ContextMenu({ position, entries, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [placement, setPlacement] = useState<MenuPosition>(position);

  // Keep the whole menu on screen: near the right/bottom edges it is shifted
  // left/up. Measured before paint (layout effect), so it never visibly jumps.
  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPlacement({
      x: clamp(position.x, VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
      y: clamp(position.y, VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN),
    });
  }, [position]);

  useClickOutside(ref, onClose);
  useKeyboardShortcuts([{ shortcut: { key: "Escape" }, handler: onClose }]);

  useEffect(() => {
    // capture: true catches scrolling in any nested scroll container, not just the window.
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return createPortal(
    <MenuList
      ref={ref}
      entries={entries}
      onSelected={onClose}
      className="fixed"
      style={{ left: placement.x, top: placement.y }}
    />,
    document.body,
  );
}
