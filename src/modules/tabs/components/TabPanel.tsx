import { cn } from "@/shared/utils/class-names.utils";
import type { TabPanelProps } from "../tabs.types";

/**
 * Container for one tab's content. Inactive tabs stay mounted but hidden, so
 * switching back keeps the scroll position, zoom and rendered pages.
 *
 * Why `invisible` and not `hidden` (display: none): with display:none the
 * element has no size, so its scroll position resets and "fit width" would
 * measure 0. `invisible` keeps the layout intact while hiding it.
 * `inert` makes hidden content unclickable and unfocusable with Tab.
 */
export function TabPanel({ isActive, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      inert={!isActive}
      className={cn("absolute inset-0", !isActive && "invisible")}
    >
      {children}
    </div>
  );
}
