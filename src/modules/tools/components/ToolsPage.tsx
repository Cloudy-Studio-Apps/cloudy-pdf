import { SealScene } from "@/shared/mascot/components/SealScene";
import { ToolCategorySection } from "./ToolCategorySection";
import { TOOL_CATEGORIES } from "../tools.constants";
import type { ToolsPageProps } from "../tools.types";

// Counted once at load: the catalog is static data.
const TOOLS = TOOL_CATEGORIES.flatMap((category) => category.tools);
const READY_COUNT = TOOLS.filter((tool) => tool.body).length;

/** Tools tab: the full catalog of PDF tools, grouped by category. Ready tools open in their own tab. */
export function ToolsPage({ onOpenTool }: ToolsPageProps) {
  return (
    // Scrolls on its own, like the Home page.
    <div className="h-full overflow-y-auto bg-surface">
      <header className="border-b border-border bg-canvas">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-10 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
            <p className="max-w-md text-muted">
              Everything you can do with your PDFs, {TOOLS.length} tools in all. {READY_COUNT} are ready; the
              seals are still working on the rest.
            </p>
          </div>
          <SealScene mood="happy" left="up" right="up" className="hidden w-40 shrink-0 md:block" />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-10 py-10">
        {TOOL_CATEGORIES.map((category) => (
          <ToolCategorySection key={category.id} category={category} onOpenTool={onOpenTool} />
        ))}
      </div>
    </div>
  );
}
