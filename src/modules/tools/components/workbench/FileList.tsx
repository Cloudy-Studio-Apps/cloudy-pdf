import { LuArrowDown, LuArrowUp, LuFileText, LuPlus, LuX } from "react-icons/lu";
import { Button } from "@/shared/ui/Button";
import { IconButton } from "@/shared/ui/IconButton";
import type { FileListProps } from "../../tools.types";

/** The ordered input files of a tool, with buttons to reorder and remove them. */
export function FileList({ control }: FileListProps) {
  const { files, add, remove, move } = control;

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <ol className="flex flex-col border border-border">
          {files.map((file, index) => (
            <li key={file.id} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
              <span className="w-5 text-right text-xs text-subtle">{index + 1}</span>
              <LuFileText className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate" title={file.path}>
                {file.name}
              </span>
              <IconButton icon={LuArrowUp} label="Move up" disabled={index === 0} onClick={() => move(file.id, -1)} />
              <IconButton
                icon={LuArrowDown}
                label="Move down"
                disabled={index === files.length - 1}
                onClick={() => move(file.id, 1)}
              />
              <IconButton icon={LuX} label={`Remove ${file.name}`} onClick={() => remove(file.id)} />
            </li>
          ))}
        </ol>
      )}
      <Button variant="ghost" icon={LuPlus} className="self-start border border-border" onClick={add}>
        Add PDFs
      </Button>
    </div>
  );
}
