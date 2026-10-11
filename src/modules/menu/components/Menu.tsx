import { cn } from "@/shared/utils/class-names.utils";
import { MenuItem } from "./MenuItem";
import type { MenuProps } from "../menu.types";

export function Menu({ menu, isOpen, onToggle, onHover, onClose }: MenuProps) {
  return (
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
