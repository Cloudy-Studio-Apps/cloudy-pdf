import { LuAppWindow, LuFileText, LuFolderSearch, LuTrash2 } from "react-icons/lu";
import { separator } from "@/modules/menu/menu.utils";
import type { MenuEntry } from "@/modules/menu/menu.types";
import type { HistoryEntry } from "@/modules/history/history.types";
import { isDesktop } from "@/shared/utils/platform.utils";
import type { RecentFileActions } from "./home.types";

/**
 * Right-click menu of a recent file:
 *   Open · Show in file manager · Open with… │ Remove from history
 * The file manager and "Open with…" entries only exist on desktop.
 */
export function buildRecentFileMenu(entry: HistoryEntry, actions: RecentFileActions): MenuEntry[] {
  const { path } = entry;
  const desktopOnly: MenuEntry[] = isDesktop
    ? [
        {
          id: "reveal",
          label: "Show in file manager",
          icon: LuFolderSearch,
          onSelect: () => actions.onReveal(path),
        },
        { id: "open-with", label: "Open with…", icon: LuAppWindow, onSelect: () => actions.onOpenWith(path) },
      ]
    : [];

  return [
    { id: "open", label: "Open", icon: LuFileText, onSelect: () => actions.onOpen(path) },
    ...desktopOnly,
    separator("divider"),
    {
      id: "remove",
      label: "Remove from history",
      icon: LuTrash2,
      danger: true,
      onSelect: () => actions.onRemove(path),
    },
  ];
}
