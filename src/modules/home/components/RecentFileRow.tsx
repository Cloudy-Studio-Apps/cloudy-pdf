import { LuFileText, LuX } from "react-icons/lu";
import { useLongPress } from "@/shared/hooks/useLongPress";
import { IconButton } from "@/shared/ui/IconButton";
import { cn } from "@/shared/utils/class-names.utils";
import { formatBytes, formatRelativeTime } from "@/shared/utils/format.utils";
import { getParentFolderName } from "@/shared/utils/path.utils";
import { RECENT_COLUMNS } from "../home.constants";
import type { RecentFileRowProps } from "../home.types";

/**
 * One recent file. The row is a button that reopens the file; the remove
 * button sits beside it (not inside), because buttons can't be nested in HTML.
 * Right-click (mouse) or press-and-hold (touch) opens the context menu,
 * which is handled by RecentFiles.
 */
export function RecentFileRow({
  entry,
  isMenuOpen,
  onOpen,
  onRemove,
  onContextMenu,
  onLongPress,
}: RecentFileRowProps) {
  const longPress = useLongPress((point) => onLongPress(point, entry));

  return (
    <li
      role="row"
      className={cn("group flex items-center transition-colors hover:bg-hover", isMenuOpen && "bg-hover")}
      onContextMenu={(event) => onContextMenu(event, entry)}
      {...longPress}
    >
      <button
        type="button"
        // Full path as tooltip, since the table only shows the folder name.
        title={entry.path}
        className={cn(RECENT_COLUMNS, "h-11 min-w-0 flex-1 px-3 text-left")}
        onClick={() => onOpen(entry.path)}
      >
        <span role="cell" className="flex min-w-0 items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center bg-red-50">
            <LuFileText className="size-3.5 text-red-600" />
          </span>
          <span className="truncate font-medium">{entry.name}</span>
        </span>
        <span role="cell" className="truncate text-muted">
          {getParentFolderName(entry.path) || "—"}
        </span>
        <span role="cell" className="text-muted">
          {formatRelativeTime(entry.openedAt)}
        </span>
        <span role="cell" className="text-right tabular-nums text-muted">
          {formatBytes(entry.size)}
        </span>
      </button>
      <IconButton
        icon={LuX}
        label={`Remove ${entry.name} from recent`}
        // Only visible on hover / keyboard focus, to keep the list calm.
        className="mr-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => onRemove(entry.path)}
      />
    </li>
  );
}
