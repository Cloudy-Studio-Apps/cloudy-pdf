import type { MouseEvent } from "react";
import { LuX } from "react-icons/lu";
import { cn } from "@/shared/utils/class-names.utils";
import { TAB_ICONS } from "../tabs.constants";
import { isClosable } from "../tabs.utils";
import type { TabItemProps } from "../tabs.types";

const MIDDLE_BUTTON = 1;

/** One tab: icon + title, plus a close button for document tabs. */
export function TabItem({ tab, isActive, onActivate, onClose }: TabItemProps) {
  const Icon = TAB_ICONS[tab.kind];
  const closable = isClosable(tab);

  // Middle-click closes, like in browsers.
  const onAuxClick = (event: MouseEvent) => {
    if (event.button === MIDDLE_BUTTON && closable) onClose(tab.id);
  };

  return (
    // `group` lets the close button react to hovering anywhere on the tab.
    // Flat, square tabs: the active one is marked by a 2px underline in ink color
    // (border-b-2 on every tab, transparent when inactive, so text never shifts).
    <div
      className={cn(
        "group flex h-full shrink-0 items-center border-b-2 border-r border-r-border transition-colors",
        isActive
          ? "border-b-ink text-ink"
          : "border-b-transparent text-muted hover:bg-hover hover:text-ink",
      )}
      onAuxClick={onAuxClick}
    >
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        title={tab.title}
        className={cn("flex h-full items-center gap-2 pl-3.5", closable ? "pr-1.5" : "pr-3.5")}
        onClick={() => onActivate(tab.id)}
      >
        <Icon className="size-3.5 shrink-0" />
        {/* Long file names are truncated; the full name is in the tooltip (title). */}
        <span className={cn("truncate", closable && "max-w-44")}>{tab.title}</span>
      </button>

      {closable && (
        <button
          type="button"
          aria-label={`Close ${tab.title}`}
          // Hidden until hover (or always shown on the active tab) to keep the bar clean.
          className={cn(
            "mr-2 flex size-5 items-center justify-center text-subtle transition hover:bg-border hover:text-ink",
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          )}
          onClick={() => onClose(tab.id)}
        >
          <LuX className="size-3" />
        </button>
      )}
    </div>
  );
}
