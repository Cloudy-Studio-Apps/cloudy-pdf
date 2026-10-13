import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { cn } from "@/shared/utils/class-names.utils";
import { MenuList } from "./MenuList";
import type { DropdownMenuProps } from "../menu.types";

/**
 * A toolbar button that opens a menu under it (zoom, page display, ⋯).
 * Same panel as the menu bar and context menus (MenuList); closes on outside press,
 * Escape, or after picking an item.
 */
export function DropdownMenu({ label, trigger, entries, align = "start", className }: DropdownMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useClickOutside(ref, close, isOpen);
  useKeyboardShortcuts(isOpen ? [{ shortcut: { key: "Escape" }, handler: close }] : []);

  return (
    // `relative` anchors the absolutely positioned menu under the button.
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "inline-flex h-7 items-center gap-1 px-1.5 text-muted transition-colors hover:bg-hover hover:text-ink",
          "focus-visible:outline-2 focus-visible:outline-accent",
          isOpen && "bg-hover text-ink",
          className,
        )}
        onClick={() => setOpen((open) => !open)}
      >
        {trigger}
      </button>
      {isOpen && (
        <MenuList
          entries={entries}
          onSelected={close}
          className={cn("absolute top-full mt-1", align === "end" ? "right-0" : "left-0")}
        />
      )}
    </div>
  );
}
