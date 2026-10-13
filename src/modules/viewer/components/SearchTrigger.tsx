import { LuSearch } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import type { SearchTriggerProps } from "../viewer.types";

/**
 * Opens the find bar. Looks like a search field on wide screens (like Acrobat's),
 * and is just an icon on phones. The real input lives in the find bar, so there's
 * only ever one search box.
 */
export function SearchTrigger({ shortcut, onClick }: SearchTriggerProps) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="hidden h-7 w-64 items-center gap-2 border border-border px-2 text-subtle transition-colors hover:border-muted hover:text-muted focus-visible:outline-2 focus-visible:outline-accent md:flex"
      >
        <LuSearch className="size-3.5" />
        <span className="flex-1 text-left">Search text</span>
        <kbd className="font-sans text-xs">{formatShortcut(shortcut)}</kbd>
      </button>
      <IconButton className="md:hidden" icon={LuSearch} label="Search text" onClick={onClick} />
    </>
  );
}
