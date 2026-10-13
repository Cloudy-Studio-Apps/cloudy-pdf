/**
 * The annotations module: marks the user adds on top of the pages (for now,
 * freehand ink strokes). Each one is an object that can be selected, moved and
 * deleted, with undo/redo. It holds plain data only; the app hands it to the pdf
 * module to write into the file on save.
 */
import type { PointerEvent, RefObject } from "react";
import type { PageSize } from "@/modules/pdf/pdf.types";
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

/** Colour and line width of a stroke. Width is in page space (PDF points). */
export interface InkStyle {
  /** CSS hex colour, "#rrggbb". */
  color: string;
  thickness: number;
}

/** One freehand stroke: what a single press-drag-release draws. */
export interface InkAnnotation extends InkStyle {
  id: string;
  /** 1-based. */
  pageNumber: number;
  points: PagePoint[];
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
  style: InkStyle;
  setStyle: (style: InkStyle) => void;
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
  style: InkStyle;
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
  onFinish: (points: PagePoint[]) => void;
}

/** Pointer handlers for the overlay SVG while drawing, plus the stroke being drawn. */
export interface StrokeDrawing {
  points: PagePoint[] | null;
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
