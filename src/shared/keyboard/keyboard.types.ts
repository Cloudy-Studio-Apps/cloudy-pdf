/** Describes a key combination, independent of the platform. */
export interface KeyboardShortcut {
  /** Value of `KeyboardEvent.key`, e.g. "o", "=", "Escape". */
  key: string;
  /** Ctrl on Windows/Linux, Cmd on macOS. */
  mod?: boolean;
  shift?: boolean;
}

export type ShortcutHandler = (event: KeyboardEvent) => void;

/** A shortcut paired with what it should do. */
export interface ShortcutBinding {
  shortcut: KeyboardShortcut;
  handler: ShortcutHandler;
}
