import { useEffect, useState, type FormEvent } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import type { PageNavigatorProps } from "../viewer.types";

/** Previous / next buttons and an editable "3 / 20" page field. */
export function PageNavigator({ navigation }: PageNavigatorProps) {
  const { currentPage, pageCount, goToPage } = navigation;
  // `draft` is what's typed in the input. It's separate from currentPage so typing
  // "12" doesn't jump to page 1 after the first keystroke; we only navigate on Enter.
  const [draft, setDraft] = useState(String(currentPage));

  // When the page changes by scrolling, show it in the input.
  useEffect(() => setDraft(String(currentPage)), [currentPage]);

  // Enter pressed: go to the typed page (goToPage clamps out-of-range values).
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const pageNumber = Number(draft);
    if (Number.isFinite(pageNumber)) goToPage(pageNumber);
    else setDraft(String(currentPage));
  };

  return (
    <div className="flex items-center gap-0.5">
      <IconButton
        icon={LuChevronUp}
        label="Previous page"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      />
      <form onSubmit={submit} className="flex items-center gap-1.5 px-1 text-muted">
        <input
          aria-label="Current page"
          inputMode="numeric"
          value={draft}
          // Digits only.
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
          // Leaving the field without Enter discards the edit.
          onBlur={() => setDraft(String(currentPage))}
          // Select everything on focus, so you can type a new number right away.
          onFocus={(event) => event.target.select()}
          className="h-6 w-9 rounded-md border border-border text-center tabular-nums text-ink outline-none focus:border-accent"
        />
        <span className="tabular-nums">/ {pageCount}</span>
      </form>
      <IconButton
        icon={LuChevronDown}
        label="Next page"
        disabled={currentPage >= pageCount}
        onClick={() => goToPage(currentPage + 1)}
      />
    </div>
  );
}
