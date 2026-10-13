import { LuCheck } from "react-icons/lu";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { cn } from "@/shared/utils/class-names.utils";
import type { MenuItemProps } from "../menu.types";

/** A single row in a menu: optional check mark, icon and label on the left, shortcut hint on the right. */
export function MenuItem({ item, onSelected }: MenuItemProps) {
  const { icon: Icon } = item;
  const isChoice = item.checked !== undefined;

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
        role={isChoice ? "menuitemradio" : "menuitem"}
        aria-checked={isChoice ? item.checked : undefined}
        disabled={item.disabled}
        className={cn(
          "flex h-8 w-full items-center gap-2.5 px-2.5 text-left transition-colors disabled:pointer-events-none disabled:text-subtle",
          item.danger ? "text-danger hover:bg-hover" : "text-ink hover:bg-hover",
        )}
        onClick={select}
      >
        {/* Invisible (not removed) when unchecked, so labels of a choice group stay aligned. */}
        {isChoice && <LuCheck className={cn("size-4 shrink-0 text-accent", !item.checked && "invisible")} />}
        {Icon && <Icon className="size-4 shrink-0 opacity-80" />}
        <span className="flex-1">{item.label}</span>
        {item.shortcut && <kbd className="pl-6 font-sans text-xs text-subtle">{formatShortcut(item.shortcut)}</kbd>}
      </button>
    </li>
  );
}
