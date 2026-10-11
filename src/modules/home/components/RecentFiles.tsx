import { ContextMenu } from "@/modules/menu/components/ContextMenu";
import { useContextMenu } from "@/modules/menu/hooks/useContextMenu";
import type { HistoryEntry } from "@/modules/history/history.types";
import { cn } from "@/shared/utils/class-names.utils";
import { Button } from "@/shared/ui/Button";
import { RecentFileRow } from "./RecentFileRow";
import { RECENT_COLUMNS } from "../home.constants";
import { buildRecentFileMenu } from "../home.menus";
import type { RecentFilesProps } from "../home.types";

/** "Recent" section: table of previously opened files, newest first, with a right-click menu. */
export function RecentFiles({ entries, onClear, ...actions }: RecentFilesProps) {
  // One context menu for the whole list; `target` says which file it was opened on.
  const contextMenu = useContextMenu<HistoryEntry>();
  const isEmpty = entries.length === 0;

  return (
    <section className="flex flex-col gap-3">
      <header className="flex h-8 items-center justify-between">
        <h2 className="text-[15px] font-semibold">Recent</h2>
        {!isEmpty && (
          <Button variant="ghost" className="text-muted" onClick={onClear}>
            Clear recent
          </Button>
        )}
      </header>

      {isEmpty ? (
        <p className="border border-dashed border-border px-6 py-10 text-center text-muted">
          Files you open will appear here.
        </p>
      ) : (
        <div role="table" aria-label="Recent files">
          {/* Column headers. pr-12 reserves the space of the rows' remove button. */}
          <div
            role="row"
            className={cn(RECENT_COLUMNS, "border-b border-border px-3 pr-12 pb-2 text-xs text-subtle")}
          >
            <span role="columnheader">Name</span>
            <span role="columnheader">Location</span>
            <span role="columnheader">Opened</span>
            <span role="columnheader" className="text-right">
              Size
            </span>
          </div>
          <ul className="mt-1 flex flex-col">
            {entries.map((entry) => (
              <RecentFileRow
                key={entry.path}
                entry={entry}
                isMenuOpen={contextMenu.menu?.target.path === entry.path}
                onOpen={actions.onOpen}
                onRemove={actions.onRemove}
                onContextMenu={contextMenu.open}
                onLongPress={contextMenu.openAt}
              />
            ))}
          </ul>
        </div>
      )}

      {contextMenu.menu && (
        <ContextMenu
          position={contextMenu.menu.position}
          entries={buildRecentFileMenu(contextMenu.menu.target, actions)}
          onClose={contextMenu.close}
        />
      )}
    </section>
  );
}
