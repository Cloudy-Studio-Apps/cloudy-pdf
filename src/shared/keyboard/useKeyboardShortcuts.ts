import { useEffect, useRef } from "react";
import type { ShortcutBinding } from "./keyboard.types";
import { matchesShortcut } from "./keyboard.utils";

/**
 * Registers global keyboard shortcuts while the calling component is mounted.
 * Every shortcut in the app (open file, zoom, Escape to close) goes through here.
 *
 * Usage: useKeyboardShortcuts([{ shortcut: { key: "o", mod: true }, handler: open }]);
 */
export function useKeyboardShortcuts(bindings: ShortcutBinding[]): void {
  // Callers usually pass a new array every render. Keeping the latest one in a ref
  // means the window listener is attached once, yet always calls up-to-date handlers.
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const binding = bindingsRef.current.find(({ shortcut }) => matchesShortcut(event, shortcut));
      if (!binding) return;
      // Stop the webview's default behaviour (e.g. Ctrl+= zooming the whole UI).
      event.preventDefault();
      binding.handler(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
