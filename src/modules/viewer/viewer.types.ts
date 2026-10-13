/** Types for the viewer module (displaying a loaded PDF and its controls). */
import type { ComponentType, ReactNode } from "react";
import type { IconType } from "react-icons";
import type { OpenedDocument } from "@/modules/document/document.types";
import type { MenuEntry } from "@/modules/menu/menu.types";
import type { PageSize, PdfDocument } from "@/modules/pdf/pdf.types";
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { ObserveVisibility, Point } from "@/shared/hooks/hooks.types";

/**
 * "fit-width" / "fit-page": scale follows the viewport size (recomputed on resize).
 * "custom": a fixed scale chosen by the user.
 */
export type ZoomMode = "fit-width" | "fit-page" | "custom";

export interface ZoomState {
  mode: ZoomMode;
  /** Only meaningful in "custom" mode. */
  scale: number;
}

/** Everything the UI needs to show and change the zoom (returned by useZoom). */
export interface ZoomControl {
  /** The effective scale currently applied to the pages. */
  scale: number;
  mode: ZoomMode;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fitWidth: () => void;
  fitPage: () => void;
  /** Fixed zoom, e.g. 1 for "Actual size". Clamped to the zoom limits. */
  setScale: (scale: number) => void;
}

/** Clockwise view rotation, applied to every page on top of its own rotation. */
export type Rotation = 0 | 90 | 180 | 270;

export interface RotationControl {
  rotation: Rotation;
  rotateClockwise: () => void;
  rotateCounterclockwise: () => void;
}

/** "continuous": all pages stacked. "single": one page at a time. */
export type PageDisplay = "continuous" | "single";

/** What a drag on the pages does: select text (and annotations), pan, or draw. */
export type ViewerTool = "select" | "hand" | "draw";

/** What a page overlay is told about its page: which one, and how it's displayed. */
export interface PageOverlayProps {
  pageNumber: number;
  /** Size at 100%, not rotated by the view. */
  size: PageSize;
  scale: number;
  rotation: Rotation;
}

/**
 * Drawn over each shown page, above its text and form layers (e.g. annotations).
 * Supplied by the app, so the viewer doesn't depend on what's drawn there.
 */
export type PageOverlay = ComponentType<PageOverlayProps>;

export type SidePanelId = "thumbnails" | "bookmarks";

/** Returned by useScrollAnchor. */
export interface ScrollAnchor {
  /** Point (px from the scroll area's top-left) that stays fixed during the next zoom change. */
  setAnchor: (point: Point) => void;
}

/** Current page and ways to move (returned by usePageNavigation). */
export interface PageNavigation {
  currentPage: number;
  pageCount: number;
  /** Scrolls to a page; `topRatio` (0–1) picks a point further down it. */
  goToPage: (pageNumber: number, topRatio?: number) => void;
  /** Like goToPage, but doesn't move if the page is already on screen. */
  showPage: (pageNumber: number) => void;
}

/** A pending scroll, applied after the layout that shows the page exists. */
export interface ScrollRequest {
  pageNumber: number;
  topRatio: number;
}

/**
 * Loading a PDF as a "discriminated union": `status` tells TypeScript which
 * fields exist, so `pdf` can only be accessed once status === "ready".
 */
export type PdfLoadState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; pdf: PdfDocument; defaultPageSize: PageSize };

/** Called by a page once it knows its real size at 100%. */
export type PageSizeReporter = (pageNumber: number, size: PageSize) => void;

/** Returned by usePageSizes. */
export interface PageSizes {
  /** One entry per page; page 1's size until a page reports its own. */
  sizes: PageSize[];
  reportSize: PageSizeReporter;
}

/** A character range inside one text item (one span of a page's text layer). */
export interface TextRange {
  itemIndex: number;
  start: number;
  end: number;
}

/** One search match on a page. `id` is unique per search, so the page knows when the current match changes. */
export interface PageHighlight {
  id: string;
  ranges: TextRange[];
  current: boolean;
}

export type HighlightsByPage = ReadonlyMap<number, readonly PageHighlight[]>;

export interface UseViewerStateOptions {
  pdf: PdfDocument;
  defaultPageSize: PageSize;
  /** False while the tab is in the background: no shortcuts, no canvases. */
  isActive: boolean;
}

/** One document's view: returned by useViewerState, rendered by ViewerPages. */
export interface ViewerState {
  pdf: PdfDocument;
  isActive: boolean;
  /** Callback ref for the scrolling element. */
  scrollRootRef: (element: HTMLDivElement | null) => void;
  zoom: ZoomControl;
  navigation: PageNavigation;
  pageSizes: PageSizes;
  rotation: RotationControl;
  display: PageDisplay;
  setDisplay: (display: PageDisplay) => void;
  tool: ViewerTool;
  setTool: (tool: ViewerTool) => void;
  /** True while the hand tool is dragging. */
  isPanning: boolean;
  /** Shared observer telling pages when they're near the screen; null until the scroll area exists. */
  observe: ObserveVisibility | null;
}

export interface ViewerShortcutsOptions {
  zoom: ZoomControl;
  navigation: PageNavigation;
  display: PageDisplay;
  tool: ViewerTool;
  setTool: (tool: ViewerTool) => void;
  enabled: boolean;
}

/** Shortcuts shown in the zoom menu and registered by useViewerShortcuts. */
export interface ViewerShortcuts {
  zoomIn: KeyboardShortcut;
  zoomOut: KeyboardShortcut;
  fitPage: KeyboardShortcut;
  actualSize: KeyboardShortcut;
  fitWidth: KeyboardShortcut;
}

/** A button of the tools rail or panel rail. */
export interface RailItem<T extends string> {
  id: T;
  label: string;
  icon: IconType;
  /** Shown in the tooltip; the key itself is registered by useViewerShortcuts. */
  shortcut?: KeyboardShortcut;
}

export interface ViewerPagesProps {
  viewer: ViewerState;
  highlights: HighlightsByPage;
  pageOverlay?: PageOverlay;
}

export interface PageListProps {
  pdf: PdfDocument;
  pageSizes: PageSize[];
  scale: number;
  rotation: Rotation;
  /** The page shown in single page display; null in continuous display. */
  singlePage: number | null;
  /** Background tabs draw no canvases, which frees their memory. */
  isActive: boolean;
  observe: ObserveVisibility | null;
  highlights: HighlightsByPage;
  onPageSize: PageSizeReporter;
  pageOverlay?: PageOverlay;
}

export interface PdfPageProps {
  pdf: PdfDocument;
  pageNumber: number;
  size: PageSize;
  scale: number;
  rotation: Rotation;
  isActive: boolean;
  observe: ObserveVisibility | null;
  highlights: readonly PageHighlight[];
  onPageSize: PageSizeReporter;
  pageOverlay?: PageOverlay;
}

export interface ViewerToolbarProps {
  zoom: ZoomControl;
  navigation: PageNavigation;
}

export interface ZoomControlsProps {
  zoom: ZoomControl;
}

export interface PageNavigatorProps {
  navigation: PageNavigation;
}

export interface ViewerMessageProps {
  title: string;
  description?: string;
}

export interface DocToolbarProps {
  title: string;
  zoom: ZoomControl;
  display: PageDisplay;
  onDisplayChange: (display: PageDisplay) => void;
  onRotate: () => void;
  onSearch: () => void;
  searchShortcut: KeyboardShortcut;
  onPrint: () => void;
  printShortcut: KeyboardShortcut;
  /** Entries of the ⋯ menu (built by the app, which knows the OS actions). */
  moreEntries: MenuEntry[];
}

export interface SearchTriggerProps {
  shortcut: KeyboardShortcut;
  onClick: () => void;
}

export interface RailButtonProps {
  icon: IconType;
  label: string;
  active?: boolean;
  /** Shown but not usable (e.g. a tool that's coming soon); keeps its tooltip. */
  unavailable?: boolean;
  onClick?: () => void;
}

export interface ToolsRailProps {
  tool: ViewerTool;
  onToolChange: (tool: ViewerTool) => void;
}

export interface PanelRailProps {
  active: SidePanelId | null;
  onToggle: (panel: SidePanelId) => void;
}

export interface SidePanelProps {
  panel: SidePanelId;
  onClose: () => void;
  children: ReactNode;
}

export interface NoticeBarProps {
  message: string;
  onDismiss: () => void;
}

export interface DocumentPropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  pdf: PdfDocument;
  document: OpenedDocument;
  /** Page 1's size, shown as "Page size". */
  pageSize: PageSize;
}

export interface PropertyRowProps {
  label: string;
  value: string | null;
}
