import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { Menu } from "./Menu";
import type { MenuBarProps } from "../menu.types";

export function MenuBar({ menus }: MenuBarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpenMenuId(null), []);
  const toggle = useCallback((menuId: string) => {
    setOpenMenuId((current) => (current === menuId ? null : menuId));
  }, []);
  const hover = useCallback((menuId: string) => {
    setOpenMenuId((current) => (current ? menuId : current));
  }, []);

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
