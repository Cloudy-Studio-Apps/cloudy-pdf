/** Types used only by the app shell (`src/app`). */
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { MenuDefinition } from "@/modules/menu/menu.types";
import type { HomePageProps } from "@/modules/home/home.types";
import type { Tab, TabDirection } from "@/modules/tabs/tabs.types";
import type { OpenedDocument } from "@/modules/document/document.types";
import type { AnnotationsControl, AnnotationsLayerValue } from "@/modules/annotations/annotations.types";
import type { PageSize, PdfDocument, PdfInkStroke } from "@/modules/pdf/pdf.types";
import type { ViewerTool } from "@/modules/viewer/viewer.types";
import type { ToolHostActions, ToolsPageProps } from "@/modules/tools/tools.types";

/** Actions the shell exposes to menus and shortcuts. */
export interface AppActions {
  openDocument: () => void;
  closeActiveTab: () => void;
  cycleTab: (direction: TabDirection) => void;
  showAbout: () => void;
  /** False on Home/Tools, which can't be closed; disables "Close Tab". */
  canCloseTab: boolean;
  /** Save / Save as… for the active document (no-ops elsewhere). */
  save: () => void;
  saveAs: () => void;
  /** The active document has unsaved form values. */
  canSave: boolean;
  /** The active tab is a loaded document. */
  canSaveAs: boolean;
}

/** What a loaded document offers the File menu and shortcuts. */
export interface DocumentCommands {
  save: () => void;
  saveAs: () => void;
  isModified: boolean;
}

/**
 * How document tabs talk to the shell. Each loaded workspace registers its
 * commands under its tab id (null when it goes away), so App can route the File
 * menu to the active one.
 */
export interface DocumentHost {
  setCommands: (tabId: string, commands: DocumentCommands | null) => void;
  /** A document was written to disk, possibly under a new path ("Save as…"). */
  onSaved: (tabId: string, document: OpenedDocument) => void;
}

/** Returned by useDocumentCommands. */
export interface DocumentCommandsRegistry {
  host: DocumentHost;
  /** The commands of a tab, if it's a loaded document. */
  get: (tabId: string) => DocumentCommands | undefined;
}

export interface UseDocumentSaveOptions {
  document: OpenedDocument;
  pdf: PdfDocument;
  onSaved: (document: OpenedDocument) => void;
  annotations: SaveableAnnotations;
}

/** The user's strokes, as far as saving is concerned. */
export interface SaveableAnnotations {
  strokes: PdfInkStroke[];
  isModified: boolean;
  markSaved: () => void;
}

/** Returned by useDocumentAnnotations: the state, and what the page overlays read. */
export interface DocumentAnnotations {
  control: AnnotationsControl;
  layer: AnnotationsLayerValue;
}

/** Returned by useDocumentSave. */
export interface DocumentSave extends DocumentCommands {
  /** Last save failure (e.g. a read-only file), shown in the workspace. */
  error: string | null;
  clearError: () => void;
}

export interface AppHeaderProps {
  menus: MenuDefinition[];
}

/** Picks what to render inside a tab, based on its kind. */
export interface TabContentProps {
  tab: Tab;
  isActive: boolean;
  /** Everything the Home page needs; built once in App. */
  home: HomePageProps;
  documentHost: DocumentHost;
  /** What the Tools tab and the tool tabs need; built once in App. */
  tools: ToolsHost;
}

/** The Tools catalog opens tools; tools send their results to document tabs or the file manager. */
export type ToolsHost = ToolsPageProps & ToolHostActions;

/** App-wide shortcuts, defined once and reused by the menu labels and the key handlers. */
export interface AppShortcuts {
  open: KeyboardShortcut;
  closeTab: KeyboardShortcut;
  save: KeyboardShortcut;
  saveAs: KeyboardShortcut;
  nextTab: KeyboardShortcut;
  previousTab: KeyboardShortcut;
}

export interface DocumentShortcuts {
  find: KeyboardShortcut;
  print: KeyboardShortcut;
}

/** A document tab's content: loads the PDF, then shows the workspace. */
export interface DocumentWorkspaceProps {
  document: OpenedDocument;
  isActive: boolean;
  host: DocumentHost;
}

/** The loaded document's workspace (toolbar, rails, pages, panels). */
export interface WorkspaceProps {
  document: OpenedDocument;
  pdf: PdfDocument;
  defaultPageSize: PageSize;
  isActive: boolean;
  host: DocumentHost;
}

/** What the document's ⋯ menu can do. */
export interface DocumentMenuOptions {
  path: string;
  /** Wide screens show the tools in the rail; phones get them in this menu. */
  isWide: boolean;
  tool: ViewerTool;
  onToolChange: (tool: ViewerTool) => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onProperties: () => void;
  onReveal: (path: string) => void;
  onOpenWith: (path: string) => void;
}
