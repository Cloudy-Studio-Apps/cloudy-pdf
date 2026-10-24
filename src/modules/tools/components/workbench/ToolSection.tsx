import type { ToolSectionProps } from "../../tools.types";

/** One step of a tool's screen (its inputs, its options…): a title, an optional hint, the controls. */
export function ToolSection({ title, hint, children }: ToolSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </header>
      {children}
    </section>
  );
}
