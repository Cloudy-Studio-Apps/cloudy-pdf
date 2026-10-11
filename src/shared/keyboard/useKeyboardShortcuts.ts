import { useEffect, useRef } from "react";
import type { ShortcutBinding } from "./keyboard.types";
import { matchesShortcut } from "./keyboard.utils";

export function useKeyboardShortcuts(bindings: ShortcutBinding[]): void {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const binding = bindingsRef.current.find(({ shortcut }) => matchesShortcut(event, shortcut));
      if (!binding) return;
      event.preventDefault();
      binding.handler(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
