import { ToolCard } from "./ToolCard";
import type { ToolCategorySectionProps } from "../tools.types";

/** One category heading (with its color key) and the grid of its tools. */
export function ToolCategorySection({ category, onOpenTool }: ToolCategorySectionProps) {
  const headingId = `tools-${category.id}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <span className="size-2.5" style={{ backgroundColor: category.color }} aria-hidden="true" />
        <h2 id={headingId} className="text-[15px] font-semibold">
          {category.title}
        </h2>
        <span className="text-subtle">{category.tools.length}</span>
      </header>
      {/* auto-fill: as many 220px+ columns as fit, so the grid adapts from phone to desktop. */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {category.tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} color={category.color} onOpenTool={onOpenTool} />
        ))}
      </ul>
    </section>
  );
}
