import type { AppShortcuts } from "./app.types";

/**
 * Single source of truth for app shortcuts: the same objects register the key
 * handlers (useAppShortcuts) and display the hints in the menus and the Home
 * page, so they can never get out of sync.
 */
export const APP_SHORTCUTS: AppShortcuts = {
  open: { key: "o", mod: true },
  closeTab: { key: "w", mod: true },
  // Same as browsers: Ctrl+Tab / Ctrl+Shift+Tab.
  nextTab: { key: "Tab", mod: true },
  previousTab: { key: "Tab", mod: true, shift: true },
};
