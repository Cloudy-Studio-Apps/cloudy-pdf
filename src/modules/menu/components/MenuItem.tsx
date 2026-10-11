import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import type { MenuItemProps } from "../menu.types";

export function MenuItem({ item, onSelected }: MenuItemProps) {
  const select = () => {
    onSelected();
    item.onSelect();
  };

  return (
    <li role="none">
      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        className="flex h-8 w-full items-center justify-between gap-6 rounded-md px-2.5 text-left text-ink transition-colors hover:bg-hover disabled:pointer-events-none disabled:text-subtle"
        onClick={select}
      >
        <span>{item.label}</span>
        {item.shortcut && <kbd className="font-sans text-xs text-subtle">{formatShortcut(item.shortcut)}</kbd>}
      </button>
    </li>
  );
}
