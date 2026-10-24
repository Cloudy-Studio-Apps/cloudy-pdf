import { LuLoaderCircle } from "react-icons/lu";
import { Button } from "@/shared/ui/Button";
import { ToolResult } from "./ToolResult";
import type { ToolRunBarProps } from "../../tools.types";

/** The last step of every tool: the run button, then the result. */
export function ToolRunBar({ run, label, canRun, onRun, ...actions }: ToolRunBarProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <Button
        size="lg"
        icon={run.isRunning ? LuLoaderCircle : undefined}
        className="self-start disabled:opacity-40 [&_svg]:animate-spin"
        disabled={!canRun}
        onClick={onRun}
      >
        {run.isRunning ? "Working…" : label}
      </Button>
      <ToolResult state={run.state} {...actions} />
    </div>
  );
}
