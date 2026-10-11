import { cn } from "@/shared/utils/class-names.utils";
import { MenuList } from "./MenuList";
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
          "h-7 px-2.5 text-ink transition-colors hover:bg-hover",
          isOpen && "bg-hover",
        )}
        onClick={() => onToggle(menu.id)}
        onPointerEnter={() => onHover(menu.id)}
      >
        {menu.label}
      </button>

      {isOpen && (
        <MenuList entries={menu.items} onSelected={onClose} className="absolute top-full left-0 mt-1" />
      )}
    </div>
  );
}
