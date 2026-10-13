import { useEffect, useRef, type KeyboardEvent } from "react";
import { LuCaseSensitive, LuChevronDown, LuChevronUp, LuSearch, LuWholeWord, LuX } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { cn } from "@/shared/utils/class-names.utils";
import { describeResult } from "../search.utils";
import type { FindBarProps } from "../search.types";

/**
 * Row under the document toolbar: search input with the match count, previous /
 * next, Match case, Whole words, close. Enter = next, Shift+Enter = previous,
 * Escape closes. These keys are handled on the input itself: they only mean
 * something while typing in it.
 */
export function FindBar({ search }: FindBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus (and select, to type a new query right away) on open and on every Ctrl+F.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [search.focusRequest]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) search.previous();
      else search.next();
    } else if (event.key === "Escape") {
      event.preventDefault();
      search.close();
    }
  };

  const hasMatches = search.matches.length > 0;
  const toggleClass = (pressed: boolean) => cn(pressed && "bg-hover text-accent hover:text-accent");

  return (
    <div role="search" className="flex h-10 shrink-0 items-center gap-1 border-b border-border bg-surface px-2">
      <div className="flex h-7 min-w-0 flex-1 items-center gap-2 border border-border px-2 focus-within:border-accent md:max-w-sm">
        <LuSearch className="size-3.5 shrink-0 text-subtle" />
        <input
          ref={inputRef}
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search text"
          aria-label="Search text"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-subtle"
        />
        <span className="shrink-0 text-xs tabular-nums text-muted" title={search.error ?? undefined}>
          {describeResult(search)}
        </span>
      </div>
      <IconButton icon={LuChevronUp} label="Previous result (Shift+Enter)" disabled={!hasMatches} onClick={search.previous} />
      <IconButton icon={LuChevronDown} label="Next result (Enter)" disabled={!hasMatches} onClick={search.next} />
      <span className="mx-1 h-4 w-px bg-border" />
      <IconButton
        icon={LuCaseSensitive}
        label="Match case"
        aria-pressed={search.options.matchCase}
        className={toggleClass(search.options.matchCase)}
        onClick={() => search.toggleOption("matchCase")}
      />
      <IconButton
        icon={LuWholeWord}
        label="Whole words"
        aria-pressed={search.options.wholeWords}
        className={toggleClass(search.options.wholeWords)}
        onClick={() => search.toggleOption("wholeWords")}
      />
      <span className="hidden flex-1 md:block" />
      <IconButton icon={LuX} label="Close search (Esc)" onClick={search.close} />
    </div>
  );
}
