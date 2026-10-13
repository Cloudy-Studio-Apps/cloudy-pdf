import { UPCOMING_TOOLS, VIEWER_TOOLS } from "../viewer.constants";
import { RailButton } from "./RailButton";
import type { ToolsRailProps } from "../viewer.types";

/**
 * Left rail of quick tools (Acrobat-style). Select and Hand work; the rest are
 * placeholders until the PDF tools exist. Hidden on phones, where touch already
 * pans and the two working tools move into the ⋯ menu.
 */
export function ToolsRail({ tool, onToolChange }: ToolsRailProps) {
  return (
    <nav
      aria-label="Tools"
      className="hidden w-11 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-2 md:flex"
    >
      {VIEWER_TOOLS.map((item) => (
        <RailButton
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={tool === item.id}
          onClick={() => onToolChange(item.id)}
        />
      ))}
      <span className="my-1 h-px w-6 bg-border" />
      {UPCOMING_TOOLS.map((item) => (
        <RailButton key={item.id} icon={item.icon} label={`${item.label} — coming soon`} unavailable />
      ))}
    </nav>
  );
}
