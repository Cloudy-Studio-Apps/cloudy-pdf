import { LuX } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { getSidePanelLabel } from "../viewer.utils";
import type { SidePanelProps } from "../viewer.types";

/**
 * Frame of a side panel (thumbnails, bookmarks): title bar and a body for the
 * panel's content. Pushes the pages aside on wide screens; on phones it floats
 * over them (next to the rail) so the pages keep their width.
 */
export function SidePanel({ panel, onClose, children }: SidePanelProps) {
  const title = getSidePanelLabel(panel);
  return (
    <aside
      aria-label={title}
      className="absolute inset-y-0 right-11 z-20 flex w-60 flex-col border-l border-border bg-surface shadow-lg shadow-ink/5 md:static md:z-auto md:shadow-none"
    >
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-border pr-1 pl-3">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">{title}</h2>
        <IconButton icon={LuX} label="Close panel" onClick={onClose} />
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
