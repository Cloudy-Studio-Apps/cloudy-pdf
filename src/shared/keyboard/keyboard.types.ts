export interface KeyboardShortcut {
  key: string;
  /** Ctrl on Windows/Linux, Cmd on macOS. */
  mod?: boolean;
  shift?: boolean;
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface ShortcutBinding {
  shortcut: KeyboardShortcut;
  handler: ShortcutHandler;
}
