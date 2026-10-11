/**
 * Tab state transitions as pure functions: (state, input) → new state.
 * No React here, so the rules (who can close, which tab becomes active)
 * are easy to read and test in isolation. useTabs just calls these.
 */
import type { OpenedDocument } from "@/modules/document/document.types";
import type { DocumentTab, Tab, TabDirection, TabsState } from "./tabs.types";

/** Only document tabs can be closed; Home and Tools are permanent. */
export function isClosable(tab: Tab): tab is DocumentTab {
  return tab.kind === "document";
}

export function createDocumentTab(document: OpenedDocument): DocumentTab {
  return { id: document.id, kind: "document", title: document.name, document };
}

/**
 * Opens a document in a new tab and focuses it.
 * If the same file is already open, that tab is focused instead of opening a duplicate.
 */
export function openDocumentTab(state: TabsState, document: OpenedDocument): TabsState {
  const existing = state.tabs.find((tab) => isClosable(tab) && tab.document.path === document.path);
  if (existing) return { ...state, activeId: existing.id };

  const tab = createDocumentTab(document);
  return { tabs: [...state.tabs, tab], activeId: tab.id };
}

/**
 * Closes a tab (if closable). When the active tab is closed, focus moves to the
 * tab that takes its place (the one to its right), or the one to its left if it was last,
 * which matches how browsers behave.
 */
export function closeTab(state: TabsState, tabId: string): TabsState {
  const index = state.tabs.findIndex((tab) => tab.id === tabId);
  const target = state.tabs[index];
  if (!target || !isClosable(target)) return state;

  const tabs = state.tabs.filter((tab) => tab.id !== tabId);
  if (state.activeId !== tabId) return { ...state, tabs };

  // There's always at least Home and Tools left, so a neighbour exists.
  const neighbour = tabs[index] ?? tabs[index - 1];
  return { tabs, activeId: neighbour.id };
}

/** Moves focus to the next (1) or previous (-1) tab, wrapping around at the ends. */
export function cycleTab(state: TabsState, direction: TabDirection): TabsState {
  const index = state.tabs.findIndex((tab) => tab.id === state.activeId);
  const count = state.tabs.length;
  // `+ count` keeps the result positive when going left from the first tab.
  const next = state.tabs[(index + direction + count) % count];
  return { ...state, activeId: next.id };
}

/** Focuses a tab, ignoring unknown ids. */
export function activateTab(state: TabsState, tabId: string): TabsState {
  return state.tabs.some((tab) => tab.id === tabId) ? { ...state, activeId: tabId } : state;
}
