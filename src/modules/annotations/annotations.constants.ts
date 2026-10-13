/** Choices and tuning values for annotations. */
import { LuFeather, LuHighlighter, LuPen, LuPenTool } from "react-icons/lu";
import type {
  AnnotationShortcuts,
  AnnotationsHistory,
  PenDefinition,
  PenKind,
  PenStyle,
} from "./annotations.types";

/** Pen colours: black, then the usual marker set (yellow mostly for the highlighter). */
export const INK_COLORS = ["#18181b", "#dc2626", "#facc15", "#16a34a", "#2563eb", "#9333ea"] as const;

/**
 * The Draw tool's pens, in the bar's order. All pen-specific behaviour comes from
 * these entries, so a new pen is a new entry here.
 */
export const PENS: Record<PenKind, PenDefinition> = {
  pen: {
    id: "pen",
    label: "Pen",
    icon: LuPen,
    smooth: false,
    variableWidth: false,
    filled: false,
    multiply: false,
    opacity: 1,
    thicknesses: [1, 2.5, 5],
  },
  smooth: {
    id: "smooth",
    label: "Smooth pen",
    icon: LuPenTool,
    smooth: true,
    variableWidth: false,
    filled: false,
    multiply: false,
    opacity: 1,
    thicknesses: [1, 2.5, 5],
  },
  highlighter: {
    id: "highlighter",
    label: "Highlighter",
    icon: LuHighlighter,
    smooth: true,
    variableWidth: false,
    filled: true,
    multiply: true,
    opacity: 0.4,
    thicknesses: [8, 14, 22],
  },
  fountain: {
    id: "fountain",
    label: "Fountain pen",
    icon: LuFeather,
    smooth: true,
    variableWidth: true,
    filled: true,
    multiply: false,
    opacity: 1,
    thicknesses: [1.5, 3, 5],
  },
};

/**
 * Line heights (px) previewing fine / medium / bold in the bar. By size, not the
 * real width, so a 22 pt highlighter still fits the button.
 */
export const SIZE_PREVIEWS = [1, 2.5, 5] as const;

export const DEFAULT_PEN_STYLE: PenStyle = { pen: "pen", color: INK_COLORS[4], size: 1 };

/**
 * Stabilizer strength: each new point moves this fraction of the way from the
 * line's end to the pointer. Lower is steadier but trails further behind.
 */
export const STABILIZER = 0.35;

/** Points dropped on release if within this distance of the simplified line (page space). */
export const SIMPLIFY_TOLERANCE = 0.35;

/**
 * Fountain pen width, as a factor of the pen's base width: a stylus maps
 * pressure 0–1 onto this range; a mouse or finger maps speed onto it, fast = thin.
 */
export const FOUNTAIN_MIN_WIDTH = 0.35;
export const FOUNTAIN_MAX_WIDTH = 1.4;

/** Speed (page units per ms) at which the fountain pen reaches its thinnest line. */
export const FOUNTAIN_FAST_SPEED = 2;

/** How quickly the fountain pen's width follows its target (0–1); lower avoids sudden blobs. */
export const WIDTH_SMOOTHING = 0.3;

/** Control point distance for drawing a quarter circle with a cubic Bézier curve. */
export const BEZIER_CIRCLE = 0.5523;

/**
 * Extra width (page space, each side) of a stroke's invisible hit area, so thin
 * lines are still easy to grab with a mouse or a finger.
 */
export const HIT_PADDING = 6;

/** Side of the selection box's corner handles, in screen pixels (same at every zoom). */
export const HANDLE_SIZE = 9;

/** Smallest a stroke can be scaled down to (its longer side), in page space. */
export const MIN_STROKE_SIZE = 4;

/** Corners of the selection box that carry a resize handle. */
export const RESIZE_CORNERS = ["nw", "ne", "sw", "se"] as const;

/** Gap between a selected stroke and its dashed selection box, in page space. */
export const SELECTION_PADDING = 4;

/**
 * Points closer than this to the previous one are skipped while drawing
 * (page space). Keeps strokes light without visibly changing their shape.
 */
export const MIN_POINT_DISTANCE = 0.75;

/** How many steps Ctrl+Z can go back. */
export const MAX_HISTORY = 100;

// One shared empty array, so a new document's `present` and `saved` are the same
// reference: nothing to save until something changes.
const NO_ANNOTATIONS: AnnotationsHistory["present"] = [];

export const EMPTY_HISTORY: AnnotationsHistory = {
  present: NO_ANNOTATIONS,
  past: [],
  future: [],
  saved: NO_ANNOTATIONS,
};

/** Marks strokes (and their selection boxes) so a press elsewhere can be told apart and deselect. */
export const ANNOTATION_ATTRIBUTE = "data-annotation-id";

/** Same keys as most editors. Undo/redo leave text fields alone (their own undo). */
export const ANNOTATION_SHORTCUTS: AnnotationShortcuts = {
  undo: { key: "z", mod: true },
  redo: { key: "z", mod: true, shift: true },
  redoAlt: { key: "y", mod: true },
  delete: { key: "Delete" },
  deleteAlt: { key: "Backspace" },
  deselect: { key: "Escape" },
};
