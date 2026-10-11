import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import type { ShortcutBinding } from "@/shared/keyboard/keyboard.types";
import type { ZoomControl } from "../viewer.types";

/**
 * Zoom shortcuts, active only while `enabled` (the viewer's tab is visible).
 * Two bindings for zoom in because "+" needs Shift on most layouts:
 * Ctrl+= (no Shift) and Ctrl++ (with Shift) both work.
 */
export function useViewerShortcuts(zoom: ZoomControl, enabled: boolean): void {
  const bindings: ShortcutBinding[] = [
    { shortcut: { key: "=", mod: true }, handler: zoom.zoomIn },
    { shortcut: { key: "+", mod: true, shift: true }, handler: zoom.zoomIn },
    { shortcut: { key: "-", mod: true }, handler: zoom.zoomOut },
    { shortcut: { key: "0", mod: true }, handler: zoom.fitWidth },
  ];

  useKeyboardShortcuts(enabled ? bindings : []);
}
