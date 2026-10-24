/**
 * Keeps the open tabs in sessionStorage, so they survive a page reload.
 *
 * Why: on Android, opening a file from another app sends ours to the background,
 * and a reload can follow (in dev, Vite's client reloads after its connection
 * drops; the system can also reload the WebView). Without this, the document
 * that was just opened would vanish.
 *
 * sessionStorage (not the persistent store) on purpose: it survives reloads but
 * not closing the app, which starts clean like a desktop app.
 * Storage can be unavailable or hold garbage, so every access is guarded.
 */
import { TABS_SESSION_KEY } from "../tabs.constants";
import type { TabsSession } from "../tabs.types";

const isTabsSession = (value: unknown): value is TabsSession =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as TabsSession).documents) &&
  (value as TabsSession).documents.every((path) => typeof path === "string") &&
  // Missing in sessions saved before tool tabs existed.
  ((value as TabsSession).tools === undefined ||
    (Array.isArray((value as TabsSession).tools) &&
      (value as TabsSession).tools.every((id) => typeof id === "string"))) &&
  typeof (value as TabsSession).active === "string";

export function loadTabsSession(): TabsSession | null {
  try {
    const raw = sessionStorage.getItem(TABS_SESSION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isTabsSession(parsed) ? { ...parsed, tools: parsed.tools ?? [] } : null;
  } catch {
    return null;
  }
}

export function saveTabsSession(session: TabsSession): void {
  try {
    sessionStorage.setItem(TABS_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save open tabs", error);
  }
}
