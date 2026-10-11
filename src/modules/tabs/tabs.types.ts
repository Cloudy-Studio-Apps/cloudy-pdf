/**
 * The tabs module manages which pages are open and which one is visible.
 * It doesn't render page content itself; the app decides what each tab shows.
 */
import type { ReactNode } from "react";
import type { OpenedDocument } from "@/modules/document/document.types";

export type TabKind = "home" | "tools" | "document";

interface BaseTab {
  id: string;
  title: string;
}

/** Fixed tabs: always present, cannot be closed. */
export interface HomeTab extends BaseTab {
  kind: "home";
}

export interface ToolsTab extends BaseTab {
  kind: "tools";
}

/** One tab per opened PDF; closable. */
export interface DocumentTab extends BaseTab {
  kind: "document";
  document: OpenedDocument;
}

/**
 * Discriminated union: checking `tab.kind` tells TypeScript which fields exist
 * (only a DocumentTab has `document`).
 */
export type Tab = HomeTab | ToolsTab | DocumentTab;

export interface TabsState {
  tabs: Tab[];
  activeId: string;
}

export type TabDirection = 1 | -1;

/**
 * What survives a page reload: which documents were open and which tab was active.
 * Only paths, not file contents, which are re-read on restore.
 */
export interface TabsSession {
  /** Paths of the open document tabs, in tab order. */
  documents: string[];
  /** The active tab: a fixed tab's id ("home", "tools") or a document's path. */
  active: string;
}

/** Everything the UI needs to show and drive the tabs (returned by useTabs). */
export interface TabsControl {
  tabs: Tab[];
  activeTab: Tab;
  activate: (tabId: string) => void;
  openDocument: (document: OpenedDocument) => void;
  close: (tabId: string) => void;
  closeActive: () => void;
  cycle: (direction: TabDirection) => void;
  /** Reopens a saved session's documents (already re-read) in one update. */
  restore: (documents: OpenedDocument[], active: string) => void;
}

export interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export interface TabPanelProps {
  isActive: boolean;
  children: ReactNode;
}
