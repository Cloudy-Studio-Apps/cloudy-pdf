import type { AppShortcuts, DocumentShortcuts } from "./app.types";

/**
 * Single source of truth for app shortcuts: the same objects register the key
 * handlers (useAppShortcuts) and display the hints in the menus and the Home
 * page, so they can never get out of sync.
 */
export const APP_SHORTCUTS: AppShortcuts = {
  open: { key: "o", mod: true },
  closeTab: { key: "w", mod: true },
  save: { key: "s", mod: true },
  saveAs: { key: "s", mod: true, shift: true },
  // Same as browsers: Ctrl+Tab / Ctrl+Shift+Tab.
  nextTab: { key: "Tab", mod: true },
  previousTab: { key: "Tab", mod: true, shift: true },
};

/** Document shortcuts (active document tab only); also shown in the toolbar hints. */
export const DOCUMENT_SHORTCUTS: DocumentShortcuts = {
  find: { key: "f", mod: true },
  print: { key: "p", mod: true },
};

/** Same breakpoint as Tailwind's `md`: below it the document workspace uses the phone layout. */
export const WIDE_LAYOUT_QUERY = "(min-width: 48rem)";
