import { cn } from "@/shared/utils/class-names.utils";
import { MenuItem } from "./MenuItem";
import { MenuSeparator } from "./MenuSeparator";
import { isSeparator } from "../menu.utils";
import type { MenuListProps } from "../menu.types";

/**
 * The floating panel with the menu entries. Shared by the menu bar dropdowns
 * and the context menus, so both always look and behave the same.
 * Positioning is up to the caller (via className / style).
 */
export function MenuList({ entries, onSelected, className, style, ref }: MenuListProps) {
  return (
    <ul
      ref={ref}
      role="menu"
      style={style}
      className={cn("z-40 min-w-52 border border-border bg-surface p-1 shadow-lg shadow-ink/5", className)}
    >
      {entries.map((entry) =>
        isSeparator(entry) ? (
          <MenuSeparator key={entry.id} />
        ) : (
          <MenuItem key={entry.id} item={entry} onSelected={onSelected} />
        ),
      )}
    </ul>
  );
}
