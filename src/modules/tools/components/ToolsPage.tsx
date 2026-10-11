import { SealScene } from "@/shared/mascot/components/SealScene";
import { ToolCategorySection } from "./ToolCategorySection";
import { TOOL_CATEGORIES } from "../tools.constants";

// Counted once at load: the catalog is static data.
const TOOL_COUNT = TOOL_CATEGORIES.reduce((total, category) => total + category.tools.length, 0);

/** Tools tab: the full catalog of PDF tools, grouped by category. Display only for now. */
export function ToolsPage() {
  return (
    // Scrolls on its own, like the Home page.
    <div className="h-full overflow-y-auto bg-surface">
      <header className="border-b border-border bg-canvas">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-10 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
            <p className="max-w-md text-muted">
              Everything you can do with your PDFs, {TOOL_COUNT} tools in all. The seals are still working on
              them, so they're coming soon.
            </p>
          </div>
          <SealScene mood="happy" left="up" right="up" className="hidden w-40 shrink-0 md:block" />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-10 py-10">
        {TOOL_CATEGORIES.map((category) => (
          <ToolCategorySection key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
