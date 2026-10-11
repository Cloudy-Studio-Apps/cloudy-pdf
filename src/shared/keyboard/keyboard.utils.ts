import type { KeyboardShortcut } from "./keyboard.types";

// Detected once: decides whether "mod" means Cmd (macOS) or Ctrl (everything else).
const isMac = navigator.userAgent.includes("Mac");

/**
 * True when the event is exactly this shortcut.
 * Modifiers must match exactly, so Ctrl+O does not also fire on Ctrl+Shift+O.
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const modPressed = isMac ? event.metaKey : event.ctrlKey;
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    modPressed === Boolean(shortcut.mod) &&
    event.shiftKey === Boolean(shortcut.shift)
  );
}

/** Human-readable label for menus and hints: "Ctrl+O" on Linux, "⌘O" on macOS. */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.mod) parts.push(isMac ? "⌘" : "Ctrl");
  if (shortcut.shift) parts.push(isMac ? "⇧" : "Shift");
  parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  return parts.join(isMac ? "" : "+");
}
