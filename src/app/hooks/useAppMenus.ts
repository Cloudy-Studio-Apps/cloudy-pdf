import { useMemo } from "react";
import type { MenuDefinition } from "@/modules/menu/menu.types";
import { APP_SHORTCUTS } from "../app.constants";
import type { AppActions } from "../app.types";

/**
 * Builds the menu bar content for this app.
 *
 * The `menu` module is generic (it just renders definitions); the actual
 * entries live here, in the app layer, because only the app knows its actions.
 * Memoized so the menu bar doesn't re-render unless an action changes.
 */
export function useAppMenus({
  openDocument,
  closeActiveTab,
  showAbout,
  canCloseTab,
}: AppActions): MenuDefinition[] {
  return useMemo(
    () => [
      {
        id: "file",
        label: "File",
        items: [
          { id: "open", label: "Open…", shortcut: APP_SHORTCUTS.open, onSelect: openDocument },
          {
            id: "close-tab",
            label: "Close Tab",
            shortcut: APP_SHORTCUTS.closeTab,
            disabled: !canCloseTab,
            onSelect: closeActiveTab,
          },
        ],
      },
      {
        id: "help",
        label: "Help",
        items: [{ id: "about", label: "About", onSelect: showAbout }],
      },
    ],
    [openDocument, closeActiveTab, showAbout, canCloseTab],
  );
}
