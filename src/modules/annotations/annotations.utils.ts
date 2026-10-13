/**
 * Annotation rules as pure functions: the undo/redo history and stroke geometry.
 * No React here; useAnnotations and the overlay hooks just call these.
 */
import { clamp } from "@/shared/utils/math.utils";
import type { PageSize } from "@/modules/pdf/pdf.types";
import { MAX_HISTORY, MIN_STROKE_SIZE } from "./annotations.constants";
import type {
  AnnotationsHistory,
  Bounds,
  Corner,
  InkAnnotation,
  PagePoint,
  PageTransform,
} from "./annotations.types";

// --- History -----------------------------------------------------------------

/** Records a new state; anything that was undone can no longer be redone. */
function commit(history: AnnotationsHistory, present: InkAnnotation[]): AnnotationsHistory {
  return {
    ...history,
    present,
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    future: [],
  };
}

export function addAnnotation(history: AnnotationsHistory, annotation: InkAnnotation): AnnotationsHistory {
  return commit(history, [...history.present, annotation]);
}

/** Replaces the stroke with the same id (after a move or resize). */
export function updateAnnotation(history: AnnotationsHistory, stroke: InkAnnotation): AnnotationsHistory {
  if (!history.present.some((annotation) => annotation.id === stroke.id)) return history;
  return commit(
    history,
    history.present.map((annotation) => (annotation.id === stroke.id ? stroke : annotation)),
  );
}

export function removeAnnotation(history: AnnotationsHistory, id: string): AnnotationsHistory {
  if (!history.present.some((annotation) => annotation.id === id)) return history;
  return commit(
    history,
    history.present.filter((annotation) => annotation.id !== id),
  );
}

export function undo(history: AnnotationsHistory): AnnotationsHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return { ...history, present: previous, past: history.past.slice(0, -1), future: [history.present, ...history.future] };
}

export function redo(history: AnnotationsHistory): AnnotationsHistory {
  const [next, ...future] = history.future;
  if (!next) return history;
  return { ...history, present: next, past: [...history.past, history.present], future };
}

export function markSaved(history: AnnotationsHistory): AnnotationsHistory {
  return { ...history, saved: history.present };
}

// --- Geometry ----------------------------------------------------------------

export function translateStroke(stroke: InkAnnotation, dx: number, dy: number): InkAnnotation {
  return { ...stroke, points: stroke.points.map(({ x, y }) => ({ x: x + dx, y: y + dy })) };
}

/** Box around the stroke's points (the line through them, without its width). */
export function pointBounds(points: PagePoint[]): Bounds {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/** Half the widest part of the stroke: how far its ink reaches from the centre line. */
export function inkRadius(stroke: InkAnnotation): number {
  return (stroke.widths ? Math.max(...stroke.widths) : stroke.thickness) / 2;
}

/** Box around the stroke, widened by half its widest line so the box covers the ink. */
export function strokeBounds(stroke: InkAnnotation): Bounds {
  const half = inkRadius(stroke);
  const { minX, minY, maxX, maxY } = pointBounds(stroke.points);
  return { minX: minX - half, minY: minY - half, maxX: maxX + half, maxY: maxY + half };
}

/** The stroke moved by (dx, dy), but no further than its page's edges. */
export function moveStroke(stroke: InkAnnotation, dx: number, dy: number, page: PageSize): InkAnnotation {
  const delta = clampMove(strokeBounds(stroke), dx, dy, page);
  return translateStroke(stroke, delta.x, delta.y);
}

/** A corner of a box. */
export function cornerPoint(bounds: Bounds, corner: Corner): PagePoint {
  return {
    x: corner.endsWith("w") ? bounds.minX : bounds.maxX,
    y: corner.startsWith("n") ? bounds.minY : bounds.maxY,
  };
}

const OPPOSITE: Record<Corner, Corner> = { nw: "se", ne: "sw", sw: "ne", se: "nw" };

/**
 * The stroke scaled proportionally by dragging `corner` from `origin` to `point`;
 * the opposite corner stays put. The line width doesn't change (like Acrobat's
 * ink), only the shape's size.
 *
 * The factor is how far the pointer went along the anchor→origin direction
 * (a projection), relative to where it was grabbed, so nothing jumps on the first
 * move. It's limited so the stroke stays larger than MIN_STROKE_SIZE and inside
 * the page. A dot or straight line along one axis still scales along the other.
 */
export function resizeStroke(
  stroke: InkAnnotation,
  corner: Corner,
  origin: PagePoint,
  point: PagePoint,
  page: PageSize,
): InkAnnotation {
  const bounds = pointBounds(stroke.points);
  const anchor = cornerPoint(bounds, OPPOSITE[corner]);
  const grab = { x: origin.x - anchor.x, y: origin.y - anchor.y };
  const grabLength = grab.x * grab.x + grab.y * grab.y;
  const extent = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  if (grabLength === 0 || extent === 0) return stroke;

  const factor = ((point.x - anchor.x) * grab.x + (point.y - anchor.y) * grab.y) / grabLength;
  const far = cornerPoint(bounds, corner);
  const limit = Math.min(maxScale(anchor.x, far.x, page.width), maxScale(anchor.y, far.y, page.height));
  const scale = clamp(factor, MIN_STROKE_SIZE / extent, limit);

  return {
    ...stroke,
    points: stroke.points.map(({ x, y }) => ({
      x: anchor.x + (x - anchor.x) * scale,
      y: anchor.y + (y - anchor.y) * scale,
    })),
  };
}

/** Largest factor that keeps `far`, scaled away from `anchor`, within [0, size] on one axis. */
function maxScale(anchor: number, far: number, size: number): number {
  if (far > anchor) return (size - anchor) / (far - anchor);
  if (far < anchor) return anchor / (anchor - far);
  return Number.POSITIVE_INFINITY;
}

/**
 * CSS resize cursor for a corner as it appears on screen: turning the view by
 * 90° or 270° makes a ↘ corner point ↙, so the diagonals swap.
 */
export function resizeCursor(corner: Corner, rotation: number): string {
  const mainDiagonal = corner === "nw" || corner === "se";
  return mainDiagonal === (rotation % 180 === 0) ? "nwse-resize" : "nesw-resize";
}

/**
 * Limits a move so the stroke stays on its page. A stroke larger than the page
 * (can't happen when drawn here, but keeps the maths safe) may only move inwards.
 */
export function clampMove(bounds: Bounds, dx: number, dy: number, page: PageSize): PagePoint {
  return {
    x: clamp(dx, Math.min(0, -bounds.minX), Math.max(0, page.width - bounds.maxX)),
    y: clamp(dy, Math.min(0, -bounds.minY), Math.max(0, page.height - bounds.maxY)),
  };
}

export function clampToPage(point: PagePoint, page: PageSize): PagePoint {
  return { x: clamp(point.x, 0, page.width), y: clamp(point.y, 0, page.height) };
}

export function distance(a: PagePoint, b: PagePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The overlay's viewBox is the page as displayed (sides swapped at 90° / 270°),
 * and the content group rotates page space into it, clockwise like the canvas.
 * E.g. at 90° a page point (x, y) lands at (height − y, x).
 */
export function pageTransform({ width, height }: PageSize, rotation: number): PageTransform {
  switch (rotation) {
    case 90:
      return { viewBox: `0 0 ${height} ${width}`, transform: `translate(${height} 0) rotate(90)` };
    case 180:
      return { viewBox: `0 0 ${width} ${height}`, transform: `translate(${width} ${height}) rotate(180)` };
    case 270:
      return { viewBox: `0 0 ${height} ${width}`, transform: `translate(0 ${width}) rotate(270)` };
    default:
      return { viewBox: `0 0 ${width} ${height}`, transform: "" };
  }
}

/**
 * Pointer position → page space. The group's screen matrix already includes the
 * zoom, the view rotation and the scroll position, so inverting it is enough.
 */
export function toPagePoint(group: SVGGElement, clientX: number, clientY: number): PagePoint | null {
  const matrix = group.getScreenCTM();
  if (!matrix) return null;
  const { x, y } = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  return { x, y };
}
