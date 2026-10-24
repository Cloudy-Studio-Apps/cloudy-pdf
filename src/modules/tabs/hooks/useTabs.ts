import { useCallback, useMemo, useState } from "react";
import type { OpenedDocument } from "@/modules/document/document.types";
import { INITIAL_TABS_STATE } from "../tabs.constants";
import {
  activateTab,
  closeTab,
  createToolTab,
  cycleTab,
  openDocumentTab,
  openToolTab,
  restoreTabs,
  updateDocumentTab,
} from "../tabs.utils";
import type { TabDirection, TabsControl, ToolTab } from "../tabs.types";

/**
 * Tab state for the app. All rules live in tabs.utils; this hook only stores
 * the state and exposes stable callbacks (useCallback), so components that
 * receive them don't re-render needlessly.
 */
export function useTabs(): TabsControl {
  const [state, setState] = useState(INITIAL_TABS_STATE);

  const activate = useCallback((tabId: string) => setState((s) => activateTab(s, tabId)), []);
  const close = useCallback((tabId: string) => setState((s) => closeTab(s, tabId)), []);
  const closeActive = useCallback(() => setState((s) => closeTab(s, s.activeId)), []);
  const cycle = useCallback((direction: TabDirection) => setState((s) => cycleTab(s, direction)), []);
  const openDocument = useCallback(
    (document: OpenedDocument) => setState((s) => openDocumentTab(s, document)),
    [],
  );
  const openTool = useCallback(
    (toolId: string, title: string) => setState((s) => openToolTab(s, createToolTab(toolId, title))),
    [],
  );
  const updateDocument = useCallback(
    (tabId: string, document: OpenedDocument) => setState((s) => updateDocumentTab(s, tabId, document)),
    [],
  );
  const restore = useCallback(
    (documents: OpenedDocument[], tools: ToolTab[], active: string) =>
      setState((s) => restoreTabs(s, documents, tools, active)),
    [],
  );

  // activeId always points to an existing tab (the utils guarantee it); Home is a safe fallback.
  const activeTab = useMemo(
    () => state.tabs.find((tab) => tab.id === state.activeId) ?? state.tabs[0],
    [state],
  );

  return {
    tabs: state.tabs,
    activeTab,
    activate,
    openDocument,
    openTool,
    updateDocument,
    close,
    closeActive,
    cycle,
    restore,
  };
}
