import { LuWrench } from "react-icons/lu";

/** Tools tab. Placeholder until the first tools are built. */
export function ToolsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center border border-border bg-surface">
        <LuWrench className="size-6 text-muted" />
      </div>
      <div className="space-y-1">
        <h1 className="text-[15px] font-semibold">Tools</h1>
        <p className="text-muted">PDF tools will live here.</p>
      </div>
    </div>
  );
}
