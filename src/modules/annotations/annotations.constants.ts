/** Choices and tuning values for annotations. */
import type { AnnotationShortcuts, AnnotationsHistory, InkStyle } from "./annotations.types";

/** Pen colours: black, then the usual marker set. */
export const INK_COLORS = ["#18181b", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#9333ea"] as const;

/** Line widths in PDF points (1/72 inch): fine, medium, bold. */
export const INK_THICKNESSES = [1, 2.5, 5] as const;

export const DEFAULT_INK_STYLE: InkStyle = { color: INK_COLORS[4], thickness: INK_THICKNESSES[1] };

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
