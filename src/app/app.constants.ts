import type { AppShortcuts } from "./app.types";

/**
 * Single source of truth for app shortcuts: the same object is used to
 * register the key handler (App.tsx) and to display the hint in the menu
 * and the welcome screen, so they can never get out of sync.
 */
export const APP_SHORTCUTS: AppShortcuts = {
  open: { key: "o", mod: true },
};
