import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { APP_SHORTCUTS } from "../app.constants";
import type { AppActions } from "../app.types";

/** Registers the app-wide keyboard shortcuts (file and tab actions). */
export function useAppShortcuts({ openDocument, closeActiveTab, cycleTab, save, saveAs }: AppActions): void {
  useKeyboardShortcuts([
    { shortcut: APP_SHORTCUTS.open, handler: openDocument },
    // Always captured, so the webview's own "Save page" never shows up.
    { shortcut: APP_SHORTCUTS.save, handler: save },
    { shortcut: APP_SHORTCUTS.saveAs, handler: saveAs },
    // Ctrl+W on Home/Tools is a no-op (closeTab ignores non-closable tabs),
    // and it's still captured so the webview can't use it to close the window.
    { shortcut: APP_SHORTCUTS.closeTab, handler: closeActiveTab },
    { shortcut: APP_SHORTCUTS.nextTab, handler: () => cycleTab(1) },
    { shortcut: APP_SHORTCUTS.previousTab, handler: () => cycleTab(-1) },
  ]);
}
