/** Tuning values and static data for the viewer, kept in one place so behaviour is easy to adjust. */
import {
  LuBookmark,
  LuHand,
  LuHighlighter,
  LuLayoutGrid,
  LuMessageSquare,
  LuPencil,
  LuSignature,
  LuTextCursor,
  LuType,
} from "react-icons/lu";
import type { PageHighlight, RailItem, SidePanelId, ViewerShortcuts, ViewerTool } from "./viewer.types";

/** Zoom levels used by the +/− buttons, Ctrl+= / Ctrl+− and Ctrl+wheel. */
export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;
export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

/** Choices in the toolbar's zoom menu. */
export const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;

/** Horizontal breathing room around pages, in px. Matches `px-8` in PageList. */
export const PAGE_GUTTER = 32;

/**
 * Vertical room kept in fit-page mode, in px: `pt-8` above the page plus the
 * floating toolbar's area below it.
 */
export const FIT_PAGE_VERTICAL_SPACE = 96;

/**
 * How far outside the viewport pages are pre-rendered.
 * Pages within 800px above/below the screen start drawing early,
 * so they're usually ready by the time you scroll to them.
 */
export const RENDER_MARGIN = "800px 0px";

/**
 * Where the "current page" line sits, as a fraction of the viewport height
 * from the top. A page becomes current once its top passes 35% of the screen,
 * which feels more natural than switching only when it reaches the very top.
 */
export const CURRENT_PAGE_THRESHOLD = 0.35;

/**
 * Ctrl+wheel distance (px) that counts as one zoom step.
 * A mouse wheel notch is usually ≥ 50px, so each notch is one step (like Acrobat).
 * Touchpads send many tiny deltas; they add up until they reach this amount,
 * so pinch / two-finger zoom isn't wildly fast.
 */
export const WHEEL_ZOOM_STEP = 50;

/** Pixel size of one "line" when the wheel reports lines (Firefox-style deltaMode 1). */
export const WHEEL_LINE_HEIGHT = 16;

/** Every page element carries `data-page-number` (see PdfPage); this finds them without a ref per page. */
export const PAGE_SELECTOR = "[data-page-number]";

/** Same keys as Acrobat: Ctrl+0 fit page, Ctrl+1 actual size, Ctrl+2 fit width. */
export const VIEWER_SHORTCUTS: ViewerShortcuts = {
  zoomIn: { key: "=", mod: true },
  zoomOut: { key: "-", mod: true },
  fitPage: { key: "0", mod: true },
  actualSize: { key: "1", mod: true },
  fitWidth: { key: "2", mod: true },
};

/** Working tools of the left rail. */
export const VIEWER_TOOLS: RailItem<ViewerTool>[] = [
  { id: "select", label: "Select text", icon: LuTextCursor },
  { id: "hand", label: "Hand tool (drag to scroll)", icon: LuHand },
  { id: "draw", label: "Draw", icon: LuPencil },
];

/** Shown disabled until the PDF tools exist, so the rail already reads like Acrobat's. */
export const UPCOMING_TOOLS: RailItem<string>[] = [
  { id: "comment", label: "Comment", icon: LuMessageSquare },
  { id: "highlight", label: "Highlight", icon: LuHighlighter },
  { id: "text", label: "Add text", icon: LuType },
  { id: "sign", label: "Fill & Sign", icon: LuSignature },
];

/** Panels of the right rail; `label` is also the panel title. */
export const SIDE_PANELS: RailItem<SidePanelId>[] = [
  { id: "thumbnails", label: "Page thumbnails", icon: LuLayoutGrid },
  { id: "bookmarks", label: "Bookmarks", icon: LuBookmark },
];

/** Shared empty list, so pages without matches keep a stable prop (PdfPage is memoized). */
export const NO_PAGE_HIGHLIGHTS: readonly PageHighlight[] = [];

/** Points per millimetre, for "Page size" in Document properties. */
export const POINTS_PER_MM = 72 / 25.4;
