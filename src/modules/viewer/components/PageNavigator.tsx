import { useEffect, useState, type FormEvent } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import type { PageNavigatorProps } from "../viewer.types";

export function PageNavigator({ navigation }: PageNavigatorProps) {
  const { currentPage, pageCount, goToPage } = navigation;
  const [draft, setDraft] = useState(String(currentPage));

  useEffect(() => setDraft(String(currentPage)), [currentPage]);

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
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
          onBlur={() => setDraft(String(currentPage))}
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
