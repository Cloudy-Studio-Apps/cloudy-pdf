import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import type { ShortcutBinding } from "@/shared/keyboard/keyboard.types";
import { TOOL_SHORTCUTS, VIEWER_SHORTCUTS, VIEWER_TOOLS } from "../viewer.constants";
import type { ViewerShortcutsOptions } from "../viewer.types";

/**
 * Zoom shortcuts, tool keys (V / H / N, Escape leaves Draw), plus page flipping
 * in single page display. Active only while `enabled` (the viewer's tab is visible).
 * Two bindings for zoom in because "+" needs Shift on most layouts:
 * Ctrl+= (no Shift) and Ctrl++ (with Shift) both work.
 */
export function useViewerShortcuts({
  zoom,
  navigation,
  display,
  tool,
  setTool,
  enabled,
}: ViewerShortcutsOptions): void {
  const next = () => navigation.goToPage(navigation.currentPage + 1);
  const previous = () => navigation.goToPage(navigation.currentPage - 1);

  const bindings: ShortcutBinding[] = [
    { shortcut: VIEWER_SHORTCUTS.zoomIn, handler: zoom.zoomIn },
    { shortcut: { key: "+", mod: true, shift: true }, handler: zoom.zoomIn },
    { shortcut: VIEWER_SHORTCUTS.zoomOut, handler: zoom.zoomOut },
    { shortcut: VIEWER_SHORTCUTS.fitPage, handler: zoom.fitPage },
    { shortcut: VIEWER_SHORTCUTS.actualSize, handler: () => zoom.setScale(1) },
    { shortcut: VIEWER_SHORTCUTS.fitWidth, handler: zoom.fitWidth },
    ...VIEWER_TOOLS.map(({ id }) => ({ shortcut: TOOL_SHORTCUTS[id], handler: () => setTool(id) })),
    // Like putting the pen down: back to the selection tool.
    ...(tool === "draw" ? [{ shortcut: { key: "Escape" }, handler: () => setTool("select") }] : []),
    // In continuous display these keys keep their native scrolling.
    ...(display === "single"
      ? [
          { shortcut: { key: "PageDown" }, handler: next },
          { shortcut: { key: "ArrowRight" }, handler: next },
          { shortcut: { key: "PageUp" }, handler: previous },
          { shortcut: { key: "ArrowLeft" }, handler: previous },
        ]
      : []),
  ];

  useKeyboardShortcuts(enabled ? bindings : []);
}
