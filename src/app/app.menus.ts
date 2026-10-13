import { LuAppWindow, LuFolderSearch, LuHand, LuInfo, LuPencil, LuRotateCcw, LuRotateCw, LuTextCursor } from "react-icons/lu";
import { separator } from "@/modules/menu/menu.utils";
import type { MenuEntry } from "@/modules/menu/menu.types";
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
        {
          id: "tool-select",
          label: "Select text",
          icon: LuTextCursor,
          checked: tool === "select",
          onSelect: () => options.onToolChange("select"),
        },
        {
          id: "tool-hand",
          label: "Hand tool",
          icon: LuHand,
          checked: tool === "hand",
          onSelect: () => options.onToolChange("hand"),
        },
        {
          id: "tool-draw",
          label: "Draw",
          icon: LuPencil,
          checked: tool === "draw",
          onSelect: () => options.onToolChange("draw"),
        },
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
