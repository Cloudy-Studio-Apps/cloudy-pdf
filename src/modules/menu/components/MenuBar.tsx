import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { Menu } from "./Menu";
import type { MenuBarProps } from "../menu.types";

/**
 * Horizontal menu bar. It owns the single piece of state: which menu is open.
 * Keeping it here (not inside each Menu) guarantees only one dropdown is open at a time.
 */
export function MenuBar({ menus }: MenuBarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpenMenuId(null), []);

  // Click on a menu title: open it, or close it if it was already open.
  const toggle = useCallback((menuId: string) => {
    setOpenMenuId((current) => (current === menuId ? null : menuId));
  }, []);

  // Native menu behaviour: once a menu is open, hovering another title switches to it.
  // When nothing is open, hovering does nothing.
  const hover = useCallback((menuId: string) => {
    setOpenMenuId((current) => (current ? menuId : current));
  }, []);

  // Close on outside press or Escape, but only listen while a menu is open.
  useClickOutside(barRef, close, openMenuId !== null);
  useKeyboardShortcuts(openMenuId ? [{ shortcut: { key: "Escape" }, handler: close }] : []);

  return (
    <nav ref={barRef} className="flex items-center gap-0.5" aria-label="Application menu">
      {menus.map((menu) => (
        <Menu
          key={menu.id}
          menu={menu}
          isOpen={openMenuId === menu.id}
          onToggle={toggle}
          onHover={hover}
          onClose={close}
        />
      ))}
    </nav>
  );
}
