/**
 * Tab state transitions as pure functions: (state, input) → new state.
 * No React here, so the rules (who can close, which tab becomes active)
 * are easy to read and test in isolation. useTabs just calls these.
 */
import type { OpenedDocument } from "@/modules/document/document.types";
import { INITIAL_TABS_STATE } from "./tabs.constants";
import type { ClosableTab, DocumentTab, Tab, TabDirection, TabsSession, TabsState, ToolTab } from "./tabs.types";

/** Documents and tools can be closed; Home and Tools are permanent. */
export function isClosable(tab: Tab): tab is ClosableTab {
  return tab.kind === "document" || tab.kind === "tool";
}

export function isDocumentTab(tab: Tab): tab is DocumentTab {
  return tab.kind === "document";
}

export function isToolTab(tab: Tab): tab is ToolTab {
  return tab.kind === "tool";
}

/** One tab per tool, so the tool id is the tab id (stable across reloads). */
export function createToolTab(toolId: string, title: string): ToolTab {
  return { id: `tool:${toolId}`, kind: "tool", title, toolId };
}

export function createDocumentTab(document: OpenedDocument): DocumentTab {
  return { id: document.id, kind: "document", title: document.name, document };
}

/**
 * Opens a document in a new tab and focuses it.
 * If the same file is already open, that tab is focused instead of opening a duplicate.
 */
export function openDocumentTab(state: TabsState, document: OpenedDocument): TabsState {
  const existing = state.tabs.find((tab) => isDocumentTab(tab) && tab.document.path === document.path);
  if (existing) return { ...state, activeId: existing.id };

  const tab = createDocumentTab(document);
  return { tabs: [...state.tabs, tab], activeId: tab.id };
}

/** Opens a tool in a new tab and focuses it; a tool already open is focused instead. */
export function openToolTab(state: TabsState, tool: ToolTab): TabsState {
  if (state.tabs.some((tab) => tab.id === tool.id)) return { ...state, activeId: tool.id };
  return { tabs: [...state.tabs, tool], activeId: tool.id };
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

/**
 * Points a document tab at a new version of its document: same tab, new
 * path / name / size (after "Save as…" or a save that changed the size).
 */
export function updateDocumentTab(state: TabsState, tabId: string, document: OpenedDocument): TabsState {
  const tabs = state.tabs.map((tab) =>
    tab.id === tabId && isDocumentTab(tab) ? { ...tab, title: document.name, document } : tab,
  );
  return { ...state, tabs };
}

/** The part of the tab state worth keeping across a reload. */
export function toTabsSession(tabs: Tab[], activeTab: Tab): TabsSession {
  return {
    documents: tabs.filter(isDocumentTab).map((tab) => tab.document.path),
    tools: tabs.filter(isToolTab).map((tab) => tab.toolId),
    active: sessionId(activeTab),
  };
}

/**
 * How a tab is named in a session: a document by its path (its tab id is new
 * each time the file is read), any other tab by its id.
 */
function sessionId(tab: Tab): string {
  return isDocumentTab(tab) ? tab.document.path : tab.id;
}

/**
 * Reopens a saved session's documents and tools, and focuses its active tab.
 *
 * Documents are re-read asynchronously, so something else may have happened in
 * the meantime (e.g. the OS handed over a file). If focus already moved away from
 * the initial tab, it stays there: the newest action wins over the old session.
 */
export function restoreTabs(
  state: TabsState,
  documents: OpenedDocument[],
  tools: ToolTab[],
  active: string,
): TabsState {
  const restored = tools.reduce(openToolTab, documents.reduce(openDocumentTab, state));
  if (state.activeId !== INITIAL_TABS_STATE.activeId) return { ...restored, activeId: state.activeId };

  const target = restored.tabs.find((tab) => sessionId(tab) === active);
  return { ...restored, activeId: target?.id ?? state.activeId };
}
