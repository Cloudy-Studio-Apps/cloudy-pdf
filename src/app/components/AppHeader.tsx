import { MenuBar } from "@/modules/menu/components/MenuBar";
import type { AppHeaderProps } from "../app.types";

/** Top bar with the application menu. (Open files are shown in the tab bar below it.) */
export function AppHeader({ menus }: AppHeaderProps) {
  return (
    <header className="flex h-10 shrink-0 items-center border-b border-border bg-surface px-2">
      <MenuBar menus={menus} />
    </header>
  );
}
