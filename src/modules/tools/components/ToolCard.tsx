import type { ToolCardProps } from "../tools.types";

/**
 * One tool in the grid: its seal scene on top, then name and description.
 * Display only for now: tools aren't implemented yet, so the card isn't
 * clickable and says "Coming soon" instead of pretending to work.
 */
export function ToolCard({ tool, color }: ToolCardProps) {
  const Scene = tool.scene;

  return (
    <li className="flex flex-col border border-border bg-surface">
      <div className="flex h-32 items-center justify-center border-b border-border bg-canvas">
        <Scene color={color} className="h-full" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold">{tool.name}</h3>
        <p className="text-xs leading-relaxed text-muted">{tool.description}</p>
        <span className="mt-2 self-start border border-border px-1.5 py-0.5 text-[11px] text-subtle">
          Coming soon
        </span>
      </div>
    </li>
  );
}
