import { LuAppWindow, LuFolderSearch, LuInfo, LuRotateCcw, LuRotateCw } from "react-icons/lu";
import { separator } from "@/modules/menu/menu.utils";
import type { MenuEntry } from "@/modules/menu/menu.types";
import { VIEWER_TOOLS } from "@/modules/viewer/viewer.constants";
import { isDesktop } from "@/shared/utils/platform.utils";
import type { DocumentMenuOptions } from "./app.types";

/**
 * The document toolbar's ⋯ menu:
 *   [Select · Hand · Draw │ phones only] Rotate left · Rotate right │ Document properties
 *   │ Show in file manager · Open with… (desktop only)
 * Built here because it mixes viewer actions with OS actions from the system module.
 */
export function buildDocumentMenu(options: DocumentMenuOptions): MenuEntry[] {
  const { path, tool } = options;
  const tools: MenuEntry[] = options.isWide
    ? []
    : [
        ...VIEWER_TOOLS.map(({ id, label, icon, shortcut }) => ({
          id: `tool-${id}`,
          label,
          icon,
          shortcut,
          checked: tool === id,
          onSelect: () => options.onToolChange(id),
        })),
        separator("tools"),
      ];
  const system: MenuEntry[] = isDesktop
    ? [
        separator("system"),
        { id: "reveal", label: "Show in file manager", icon: LuFolderSearch, onSelect: () => options.onReveal(path) },
        { id: "open-with", label: "Open with…", icon: LuAppWindow, onSelect: () => options.onOpenWith(path) },
      ]
    : [];

  return [
    ...tools,
    { id: "rotate-left", label: "Rotate left", icon: LuRotateCcw, onSelect: options.onRotateLeft },
    { id: "rotate-right", label: "Rotate right", icon: LuRotateCw, onSelect: options.onRotateRight },
    separator("view"),
    { id: "properties", label: "Document properties", icon: LuInfo, onSelect: options.onProperties },
    ...system,
  ];
}
