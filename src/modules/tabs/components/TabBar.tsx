import { TabItem } from "./TabItem";
import type { TabBarProps } from "../tabs.types";

/** Horizontal strip of tabs. Scrolls sideways when there are too many to fit. */
export function TabBar({ tabs, activeId, onActivate, onClose }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Open pages"
      // [scrollbar-width:none] hides the scrollbar while keeping wheel/trackpad scrolling.
      className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-border bg-surface [scrollbar-width:none]"
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeId}
          onActivate={onActivate}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
