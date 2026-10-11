import { useMemo } from "react";
import type { MenuDefinition } from "@/modules/menu/menu.types";
import { APP_SHORTCUTS } from "../app.constants";
import type { AppActions } from "../app.types";

export function useAppMenus({ openDocument, showAbout }: AppActions): MenuDefinition[] {
  return useMemo(
    () => [
      {
        id: "file",
        label: "File",
        items: [
          { id: "open", label: "Open…", shortcut: APP_SHORTCUTS.open, onSelect: openDocument },
        ],
      },
      {
        id: "help",
        label: "Help",
        items: [{ id: "about", label: "About", onSelect: showAbout }],
      },
    ],
    [openDocument, showAbout],
  );
}
