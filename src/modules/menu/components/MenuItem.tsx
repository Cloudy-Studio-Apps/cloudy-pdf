import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import type { MenuItemProps } from "../menu.types";

/** A single row in a dropdown: label on the left, shortcut hint on the right. */
export function MenuItem({ item, onSelected }: MenuItemProps) {
  const select = () => {
    // Close the dropdown first, so a dialog opened by the action isn't covered by the menu.
    onSelected();
    item.onSelect();
  };

  return (
    // role="none" removes the <li> list semantics; the button inside is the menu item.
    <li role="none">
      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        className="flex h-8 w-full items-center justify-between gap-6 px-2.5 text-left text-ink transition-colors hover:bg-hover disabled:pointer-events-none disabled:text-subtle"
        onClick={select}
      >
        <span>{item.label}</span>
        {item.shortcut && <kbd className="font-sans text-xs text-subtle">{formatShortcut(item.shortcut)}</kbd>}
      </button>
    </li>
  );
}
