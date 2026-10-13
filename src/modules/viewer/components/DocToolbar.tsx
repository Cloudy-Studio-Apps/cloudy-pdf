import { LuChevronDown, LuEllipsis, LuFile, LuFileText, LuPrinter, LuRotateCw, LuRows3 } from "react-icons/lu";
import { DropdownMenu } from "@/modules/menu/components/DropdownMenu";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { IconButton } from "@/shared/ui/IconButton";
import { toPercent } from "@/shared/utils/math.utils";
import { buildPageDisplayMenu, buildZoomMenu } from "../viewer.menus";
import { SearchTrigger } from "./SearchTrigger";
import type { DocToolbarProps } from "../viewer.types";

/**
 * The document's top bar (Acrobat-style): file name │ search │ zoom, rotate,
 * page display, print, ⋯.
 */
export function DocToolbar({
  title,
  zoom,
  display,
  onDisplayChange,
  onRotate,
  onSearch,
  searchShortcut,
  onPrint,
  printShortcut,
  moreEntries,
}: DocToolbarProps) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-surface px-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
        <LuFileText className="size-4 shrink-0 text-muted" />
        <span className="truncate font-medium text-ink" title={title}>
          {title}
        </span>
      </div>

      <SearchTrigger shortcut={searchShortcut} onClick={onSearch} />

      <div className="flex flex-1 items-center justify-end gap-0.5">
        <DropdownMenu
          label="Zoom"
          align="end"
          entries={buildZoomMenu(zoom)}
          trigger={
            <>
              {/* Fixed width + tabular-nums: the bar doesn't shift as the number changes. */}
              <span className="w-10 text-right tabular-nums">{toPercent(zoom.scale)}</span>
              <LuChevronDown className="size-3.5" />
            </>
          }
        />
        <IconButton icon={LuRotateCw} label="Rotate view clockwise" onClick={onRotate} />
        <DropdownMenu
          label="Page display"
          align="end"
          entries={buildPageDisplayMenu(display, onDisplayChange)}
          trigger={display === "single" ? <LuFile className="size-4" /> : <LuRows3 className="size-4" />}
        />
        <span className="mx-1 h-4 w-px bg-border" />
        <IconButton icon={LuPrinter} label={`Print (${formatShortcut(printShortcut)})`} onClick={onPrint} />
        <DropdownMenu label="More options" align="end" entries={moreEntries} trigger={<LuEllipsis className="size-4" />} />
      </div>
    </header>
  );
}
