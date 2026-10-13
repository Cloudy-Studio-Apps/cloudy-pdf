import { SIDE_PANELS } from "../viewer.constants";
import { RailButton } from "./RailButton";
import type { PanelRailProps } from "../viewer.types";

/** Right rail: opens a side panel; pressing the active one again closes it. */
export function PanelRail({ active, onToggle }: PanelRailProps) {
  return (
    <nav
      aria-label="Panels"
      className="flex w-11 shrink-0 flex-col items-center gap-1 border-l border-border bg-surface py-2"
    >
      {SIDE_PANELS.map((item) => (
        <RailButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={active === item.id}
          onClick={() => onToggle(item.id)}
        />
      ))}
    </nav>
  );
}
