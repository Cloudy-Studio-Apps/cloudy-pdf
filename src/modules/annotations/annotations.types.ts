/**
 * The annotations module: marks the user adds on top of the pages (for now,
 * freehand ink strokes). Each one is an object that can be selected, moved and
 * deleted, with undo/redo. It holds plain data only; the app hands it to the pdf
 * module to write into the file on save.
 */
import type { PointerEvent, RefObject } from "react";
import type { IconType } from "react-icons";
import type { PageSize, PdfPath } from "@/modules/pdf/pdf.types";
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { Rotation } from "@/modules/viewer/viewer.types";

/**
 * A point in page space: the page at 100% zoom, not rotated by the view, origin
 * top-left, y down (same space as PageSize). Zoom and rotation only apply on
 * screen, so stored points never change with them.
 */
export interface PagePoint {
  x: number;
  y: number;
}

export type PenKind = "pen" | "smooth" | "highlighter" | "fountain";

/** How a kind of pen draws. Every pen-specific behaviour is read from here. */
export interface PenDefinition {
  id: PenKind;
  label: string;
  icon: IconType;
  /** Steadies the pointer while drawing and fits curves on release. */
  smooth: boolean;
  /** Width follows stylus pressure, or speed with a mouse or finger. */
  variableWidth: boolean;
  /** Drawn and saved as a filled outline rather than a stroked line. */
  filled: boolean;
  /** Mixed with the page (multiply) so text under it stays readable. */
  multiply: boolean;
  opacity: number;
  /** Width choices in PDF points: fine, medium, bold. */
  thicknesses: readonly [number, number, number];
}

/** The Draw tool's current choices. `size` indexes the pen's `thicknesses`. */
export interface PenStyle {
  pen: PenKind;
  /** CSS hex colour, "#rrggbb". */
  color: string;
  size: number;
}

/** One freehand stroke: what a single press-drag-release draws. */
export interface InkAnnotation {
  id: string;
  /** 1-based. */
  pageNumber: number;
  pen: PenKind;
  color: string;
  /** Line width in page space (PDF points); the base width for variable-width pens. */
  thickness: number;
  points: PagePoint[];
  /** Width at each point, for variable-width pens only. */
  widths?: number[];
}

/** A stroke being drawn: where it is, and the pointer's latest state. */
export interface StrokeDraft {
  points: PagePoint[];
  widths: number[] | null;
  /** The pointer's real position; with a stabilizer the line trails behind it. */
  target: PagePoint;
  /** Time of the last sample, in ms. */
  time: number;
}

/** One pointer position as it arrives. */
export interface StrokeSample {
  point: PagePoint;
  time: number;
  /** 0–1 from a stylus; null for mouse and touch, which report no real pressure. */
  pressure: number | null;
}

/** How a stroke is drawn on screen and written to the PDF (same geometry for both). */
export interface StrokeShape {
  path: PdfPath;
  filled: boolean;
  opacity: number;
  multiply: boolean;
}

/** A stroke before it gets its id. */
export type NewInkAnnotation = Omit<InkAnnotation, "id">;

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Annotations with undo/redo. Each change stores a new array, so "unsaved" is a
 * cheap identity check: `present !== saved`. Undoing back to the saved state
 * makes the document unmodified again.
 */
export interface AnnotationsHistory {
  present: InkAnnotation[];
  past: InkAnnotation[][];
  future: InkAnnotation[][];
  saved: InkAnnotation[];
}

/**
 * How the overlay reacts to the pointer: "draw" captures every press to draw,
 * "select" only catches presses on strokes (the rest selects text), "off" is inert.
 */
export type AnnotationMode = "draw" | "select" | "off";

/** One document's annotations and their actions (returned by useAnnotations). */
export interface AnnotationsControl {
  annotations: InkAnnotation[];
  selectedId: string | null;
  select: (id: string | null) => void;
  style: PenStyle;
  setStyle: (style: PenStyle) => void;
  add: (annotation: NewInkAnnotation) => void;
  /** Replaces a stroke with a new version of itself (moved or resized). */
  update: (stroke: InkAnnotation) => void;
  remove: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Changed since the last save. */
  isModified: boolean;
  /** The current annotations were written to disk. */
  markSaved: () => void;
}

export interface UseAnnotationsOptions {
  /** Only the active tab's shortcuts and outside-click handling run. */
  isActive: boolean;
  /** Delete key, Escape and outside clicks only matter while strokes can be selected. */
  mode: AnnotationMode;
}

/** What each page overlay reads from the Workspace (via AnnotationsContext). */
export interface AnnotationsLayerValue {
  annotations: InkAnnotation[];
  selectedId: string | null;
  style: PenStyle;
  mode: AnnotationMode;
  add: (annotation: NewInkAnnotation) => void;
  update: (stroke: InkAnnotation) => void;
  select: (id: string | null) => void;
}

/** Same as the viewer's page overlay props: one page, as it's displayed. */
export interface AnnotationOverlayProps {
  pageNumber: number;
  size: PageSize;
  scale: number;
  rotation: Rotation;
}

/** SVG geometry that turns page space into the rotated page. */
export interface PageTransform {
  /** viewBox of the overlay: the displayed page at 100%. */
  viewBox: string;
  /** Transform of the content group (rotation about the page). */
  transform: string;
}

export interface UseStrokeDrawingOptions {
  /** The group in page space; its screen matrix converts pointer positions. */
  groupRef: RefObject<SVGGElement | null>;
  size: PageSize;
  enabled: boolean;
  pen: PenDefinition;
  thickness: number;
  /** A finished stroke's line, already smoothed for smoothing pens. */
  onFinish: (stroke: Pick<InkAnnotation, "points" | "widths">) => void;
}

/** Pointer handlers for the overlay SVG while drawing, plus the stroke being drawn. */
export interface StrokeDrawing {
  draft: StrokeDraft | null;
  onPointerDown: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerCancel: (event: PointerEvent<SVGSVGElement>) => void;
}

/** A corner of a selection box, in page space (before the view rotation). */
export type Corner = "nw" | "ne" | "sw" | "se";

export interface UseStrokeTransformOptions {
  groupRef: RefObject<SVGGElement | null>;
  size: PageSize;
  onSelect: (id: string) => void;
  /** Called once, on release, with the moved or resized stroke. */
  onCommit: (stroke: InkAnnotation) => void;
}

/** Where a move or resize started. `corner` is the grabbed handle, null for a move. */
export interface TransformStart {
  stroke: InkAnnotation;
  origin: PagePoint;
  corner: Corner | null;
}

export interface PointerHandlers {
  onPointerDown: (event: PointerEvent<SVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGElement>) => void;
  onPointerCancel: (event: PointerEvent<SVGElement>) => void;
}

/** Returned by useStrokeTransform. */
export interface StrokeTransform {
  /** The stroke being moved or resized, as it would be if released now. */
  preview: InkAnnotation | null;
  /** Handlers for anything that grabs the stroke to move it (its hit path, its selection box). */
  bindMove: (stroke: InkAnnotation) => PointerHandlers;
  /** Handlers for a corner handle. */
  bindResize: (stroke: InkAnnotation, corner: Corner) => PointerHandlers;
}

export interface InkPathProps {
  /** Already the preview while it's being moved or resized. */
  stroke: InkAnnotation;
  /** Catches presses (select mode). */
  interactive: boolean;
  transform: StrokeTransform;
}

export interface InkShapeProps {
  shape: StrokeShape;
  color: string;
  /** Line width, for stroked shapes. */
  thickness: number;
}

export interface SelectionBoxProps {
  stroke: InkAnnotation;
  /** Zoom: handles keep the same size on screen. */
  scale: number;
  /** View rotation: picks the right resize cursor for each corner. */
  rotation: Rotation;
  transform: StrokeTransform;
}

export interface ResizeHandleProps {
  /** Centre of the handle, page space. */
  x: number;
  y: number;
  /** Side length, page space. */
  size: number;
  cursor: string;
  handlers: PointerHandlers;
}

export interface AnnotationBarProps {
  annotations: AnnotationsControl;
  /** Shows colour and width choices (Draw tool). */
  showStyle: boolean;
}

export interface SwatchButtonProps {
  color: string;
  active: boolean;
  onClick: () => void;
}

export interface ThicknessButtonProps {
  /** Index among the pen's widths: fine, medium, bold. */
  size: number;
  /** The real width, in points (tooltip). */
  thickness: number;
  active: boolean;
  onClick: () => void;
}

export interface AnnotationShortcuts {
  undo: KeyboardShortcut;
  redo: KeyboardShortcut;
  redoAlt: KeyboardShortcut;
  delete: KeyboardShortcut;
  deleteAlt: KeyboardShortcut;
  deselect: KeyboardShortcut;
}
