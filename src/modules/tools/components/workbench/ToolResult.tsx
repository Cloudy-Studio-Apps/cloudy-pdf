import { LuFileCheck, LuFolderOpen } from "react-icons/lu";
import { Button } from "@/shared/ui/Button";
import { getFileName } from "@/shared/utils/path.utils";
import { isDesktop } from "@/shared/utils/platform.utils";
import type { ToolResultProps } from "../../tools.types";

/** What the last run did: the error, or the files written with ways to open them. */
export function ToolResult({ state, onOpenDocument, onReveal }: ToolResultProps) {
  if (state.status === "error") {
    return <p className="text-danger">{state.message}</p>;
  }
  if (state.status !== "done") return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium">
        Done: {state.outputs.length} {state.outputs.length === 1 ? "file" : "files"} saved.
      </p>
      <ul className="flex flex-col border border-border">
        {state.outputs.map((path) => (
          <li key={path} className="flex items-center gap-3 border-b border-border px-3 py-1.5 last:border-b-0">
            <LuFileCheck className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate" title={path}>
              {getFileName(path)}
            </span>
            <Button variant="ghost" onClick={() => onOpenDocument(path)}>
              Open
            </Button>
            {/* Android has no file manager to show the file in. */}
            {isDesktop && (
              <Button variant="ghost" icon={LuFolderOpen} onClick={() => onReveal(path)}>
                Show in folder
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
