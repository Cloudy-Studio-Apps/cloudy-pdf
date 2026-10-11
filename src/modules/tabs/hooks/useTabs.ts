import { useCallback, useMemo, useState } from "react";
import type { OpenedDocument } from "@/modules/document/document.types";
import { INITIAL_TABS_STATE } from "../tabs.constants";
import { activateTab, closeTab, cycleTab, openDocumentTab } from "../tabs.utils";
import type { TabDirection, TabsControl } from "../tabs.types";

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

  // activeId always points to an existing tab (the utils guarantee it); Home is a safe fallback.
  const activeTab = useMemo(
    () => state.tabs.find((tab) => tab.id === state.activeId) ?? state.tabs[0],
    [state],
  );

  return { tabs: state.tabs, activeTab, activate, openDocument, close, closeActive, cycle };
}
