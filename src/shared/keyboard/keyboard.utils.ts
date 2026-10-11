import type { KeyboardShortcut } from "./keyboard.types";

const isMac = navigator.userAgent.includes("Mac");

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const modPressed = isMac ? event.metaKey : event.ctrlKey;
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    modPressed === Boolean(shortcut.mod) &&
    event.shiftKey === Boolean(shortcut.shift)
  );
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  if (shortcut.mod) parts.push(isMac ? "⌘" : "Ctrl");
  if (shortcut.shift) parts.push(isMac ? "⇧" : "Shift");
  parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  return parts.join(isMac ? "" : "+");
}
