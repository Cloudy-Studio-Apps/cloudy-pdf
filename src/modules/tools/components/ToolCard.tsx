import { cn } from "@/shared/utils/class-names.utils";
import type { ToolCardProps } from "../tools.types";

/**
 * One tool in the grid: its seal scene on top, then name and description.
 * Implemented tools (those with a `body`) open in their own tab; the others
 * aren't clickable and say "Coming soon" instead of pretending to work.
 */
export function ToolCard({ tool, color, onOpenTool }: ToolCardProps) {
  const Scene = tool.scene;
  const isReady = Boolean(tool.body);

  const content = (
    <>
      <div className="flex h-32 w-full items-center justify-center border-b border-border bg-canvas">
        <Scene color={color} className="h-full" />
      </div>
      <div className="flex flex-1 flex-col items-start gap-1 p-4 text-left">
        <h3 className="font-semibold">{tool.name}</h3>
        <p className="text-xs leading-relaxed text-muted">{tool.description}</p>
        {!isReady && (
          <span className="mt-2 border border-border px-1.5 py-0.5 text-[11px] text-subtle">Coming soon</span>
        )}
      </div>
    </>
  );

  return (
    <li className="flex">
      {isReady ? (
        <button
          type="button"
          className={cn(
            "flex flex-1 flex-col border border-border bg-surface transition-colors hover:border-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          )}
          onClick={() => onOpenTool(tool.id, tool.name)}
        >
          {content}
        </button>
      ) : (
        <div className="flex flex-1 flex-col border border-border bg-surface">{content}</div>
      )}
    </li>
  );
}
