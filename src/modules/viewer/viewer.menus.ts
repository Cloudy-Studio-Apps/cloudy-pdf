import { LuFile, LuRows3 } from "react-icons/lu";
import { separator } from "@/modules/menu/menu.utils";
import type { MenuEntry } from "@/modules/menu/menu.types";
import { toPercent } from "@/shared/utils/math.utils";
import { VIEWER_SHORTCUTS, ZOOM_PRESETS } from "./viewer.constants";
import type { PageDisplay, ZoomControl } from "./viewer.types";

/** Toolbar zoom menu: Fit width · Fit page · Actual size │ 50% … 400%. */
export function buildZoomMenu(zoom: ZoomControl): MenuEntry[] {
  const isPreset = (scale: number) => zoom.mode === "custom" && Math.abs(zoom.scale - scale) < 0.001;
  return [
    {
      id: "fit-width",
      label: "Fit width",
      shortcut: VIEWER_SHORTCUTS.fitWidth,
      checked: zoom.mode === "fit-width",
      onSelect: zoom.fitWidth,
    },
    {
      id: "fit-page",
      label: "Fit page",
      shortcut: VIEWER_SHORTCUTS.fitPage,
      checked: zoom.mode === "fit-page",
      onSelect: zoom.fitPage,
    },
    {
      id: "actual-size",
      label: "Actual size",
      shortcut: VIEWER_SHORTCUTS.actualSize,
      checked: isPreset(1),
      onSelect: () => zoom.setScale(1),
    },
    separator("presets"),
    ...ZOOM_PRESETS.map((scale) => ({
      id: `zoom-${scale}`,
      label: toPercent(scale),
      checked: isPreset(scale),
      onSelect: () => zoom.setScale(scale),
    })),
  ];
}

/** Toolbar page display menu: Continuous · Single page. */
export function buildPageDisplayMenu(display: PageDisplay, onChange: (display: PageDisplay) => void): MenuEntry[] {
  return [
    {
      id: "continuous",
      label: "Continuous",
      icon: LuRows3,
      checked: display === "continuous",
      onSelect: () => onChange("continuous"),
    },
    {
      id: "single",
      label: "Single page",
      icon: LuFile,
      checked: display === "single",
      onSelect: () => onChange("single"),
    },
  ];
}
