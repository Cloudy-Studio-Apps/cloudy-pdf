import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import type { ZoomControl } from "../viewer.types";

export function useViewerShortcuts(zoom: ZoomControl): void {
  useKeyboardShortcuts([
    { shortcut: { key: "=", mod: true }, handler: zoom.zoomIn },
    { shortcut: { key: "+", mod: true, shift: true }, handler: zoom.zoomIn },
    { shortcut: { key: "-", mod: true }, handler: zoom.zoomOut },
    { shortcut: { key: "0", mod: true }, handler: zoom.fitWidth },
  ]);
}
