import { cn } from "@/shared/utils/class-names.utils";
import { MenuItem } from "./MenuItem";
import type { MenuProps } from "../menu.types";

/** One top-level menu: the title button plus its dropdown when open. Stateless; MenuBar decides. */
export function Menu({ menu, isOpen, onToggle, onHover, onClose }: MenuProps) {
  return (
    // `relative` anchors the absolutely positioned dropdown under this title.
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          "h-7 rounded-md px-2.5 text-ink transition-colors hover:bg-hover",
          isOpen && "bg-hover",
        )}
        onClick={() => onToggle(menu.id)}
        onPointerEnter={() => onHover(menu.id)}
      >
        {menu.label}
      </button>

      {isOpen && (
        <ul
          role="menu"
          className="absolute top-full left-0 z-40 mt-1 min-w-52 rounded-lg border border-border bg-surface p-1 shadow-lg shadow-ink/5"
        >
          {menu.items.map((item) => (
            <MenuItem key={item.id} item={item} onSelected={onClose} />
          ))}
        </ul>
      )}
    </div>
  );
}
