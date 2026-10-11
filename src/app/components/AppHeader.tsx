import { MenuBar } from "@/modules/menu/components/MenuBar";
import type { AppHeaderProps } from "../app.types";

/** Top bar: menu on the left, current file name centered. */
export function AppHeader({ menus, documentName }: AppHeaderProps) {
  return (
    <header className="relative flex h-10 shrink-0 items-center border-b border-border bg-surface px-2">
      <MenuBar menus={menus} />
      {documentName && (
        // Absolutely positioned so the title stays truly centered regardless of the menu width.
        // pointer-events-none keeps it from blocking clicks on the menus underneath.
        <p className="pointer-events-none absolute inset-x-40 truncate text-center text-muted">
          {documentName}
        </p>
      )}
    </header>
  );
}
