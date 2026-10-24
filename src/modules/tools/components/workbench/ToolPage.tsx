import { Suspense } from "react";
import { findTool } from "../../tools.utils";
import type { ToolPageProps } from "../../tools.types";

/**
 * A tool's tab: the same header for every tool (its seal scene, name and
 * description), then the tool's own screen, loaded on first use.
 */
export function ToolPage({ toolId, ...actions }: ToolPageProps) {
  const entry = findTool(toolId);
  const Body = entry?.tool.body;
  // A tab restored from an older session can name a tool that no longer exists.
  if (!entry || !Body) {
    return <p className="p-10 text-muted">This tool isn't available.</p>;
  }
  const { tool, color } = entry;
  const Scene = tool.scene;

  return (
    // Scrolls on its own, like the Home and Tools pages.
    <div className="h-full overflow-y-auto bg-surface">
      <header className="border-b border-border bg-canvas">
        <div className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-6 md:px-10">
          <Scene color={color} className="h-20 shrink-0" />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
            <p className="text-muted">{tool.description}</p>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8 md:px-10">
        <Suspense>
          <Body {...actions} />
        </Suspense>
      </div>
    </div>
  );
}
