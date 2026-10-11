import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { cn } from "@/shared/utils/class-names.utils";
import type { MenuItemProps } from "../menu.types";

/** A single row in a menu: optional icon and label on the left, shortcut hint on the right. */
export function MenuItem({ item, onSelected }: MenuItemProps) {
  const { icon: Icon } = item;

  const select = () => {
    // Close the menu first, so a dialog opened by the action isn't covered by it.
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
        className={cn(
          "flex h-8 w-full items-center gap-2.5 px-2.5 text-left transition-colors disabled:pointer-events-none disabled:text-subtle",
          item.danger ? "text-red-600 hover:bg-red-50" : "text-ink hover:bg-hover",
        )}
        onClick={select}
      >
        {Icon && <Icon className="size-4 shrink-0 opacity-80" />}
        <span className="flex-1">{item.label}</span>
        {item.shortcut && <kbd className="pl-6 font-sans text-xs text-subtle">{formatShortcut(item.shortcut)}</kbd>}
      </button>
    </li>
  );
}
