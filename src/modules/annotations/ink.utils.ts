/**
 * Pens as pure functions: turning pointer samples into a stroke (stabilizer,
 * fountain pen width, simplification on release), and turning a stroke into the
 * shape that is both drawn on screen and written to the PDF.
 */
import { clamp, lerp } from "@/shared/utils/math.utils";
import type { PathPoint, PathSegment, PdfInkStroke, PdfPath } from "@/modules/pdf/pdf.types";
import {
  BEZIER_CIRCLE,
  FOUNTAIN_FAST_SPEED,
  FOUNTAIN_MAX_WIDTH,
  FOUNTAIN_MIN_WIDTH,
  MIN_POINT_DISTANCE,
  PENS,
  SIMPLIFY_TOLERANCE,
  STABILIZER,
  WIDTH_SMOOTHING,
} from "./annotations.constants";
import { distance } from "./annotations.utils";
import type { InkAnnotation, PagePoint, PenDefinition, StrokeDraft, StrokeSample, StrokeShape } from "./annotations.types";

// --- Drawing -----------------------------------------------------------------

export function startStroke(sample: StrokeSample, pen: PenDefinition, thickness: number): StrokeDraft {
  return {
    points: [sample.point],
    widths: pen.variableWidth ? [thickness * widthFactor(sample.pressure, 0)] : null,
    target: sample.point,
    time: sample.time,
  };
}

/**
 * Adds a pointer sample. Smoothing pens don't go straight to the pointer: the
 * line moves part of the way (STABILIZER), which irons out the shaky hand and
 * the mouse's jumps, like the stabilizer of drawing apps.
 */
export function extendStroke(
  draft: StrokeDraft,
  sample: StrokeSample,
  pen: PenDefinition,
  thickness: number,
): StrokeDraft {
  const last = draft.points[draft.points.length - 1];
  const point = pen.smooth ? lerpPoint(last, sample.point, STABILIZER) : sample.point;
  const moved = { target: sample.point, time: sample.time };
  if (distance(point, last) < MIN_POINT_DISTANCE) return { ...draft, ...moved };

  const speed = distance(sample.point, draft.target) / Math.max(1, sample.time - draft.time);
  const widths = draft.widths && [
    ...draft.widths,
    // Eased towards the new width, so a sudden flick doesn't leave a blob or a gap.
    lerp(draft.widths[draft.widths.length - 1], thickness * widthFactor(sample.pressure, speed), WIDTH_SMOOTHING),
  ];
  return { points: [...draft.points, point], widths, ...moved };
}

/**
 * The finished stroke's line, or null if it's too short to keep (a click).
 * Smoothing pens first catch up with where the pointer stopped (the stabilizer
 * trails behind it), and fixed-width ones drop points that add nothing to the
 * shape; the curve fitting then makes them smooth.
 */
export function finishStroke(draft: StrokeDraft, pen: PenDefinition): Pick<InkAnnotation, "points" | "widths"> | null {
  let { points, widths } = draft;
  if (pen.smooth && distance(draft.target, points[points.length - 1]) >= MIN_POINT_DISTANCE) {
    points = [...points, draft.target];
    widths = widths && [...widths, widths[widths.length - 1]];
  }
  // Variable widths keep every point: a straight line can still change width along the way.
  if (pen.smooth && !widths) {
    const kept = simplify(points, SIMPLIFY_TOLERANCE);
    points = kept.map((index) => points[index]);
  }
  return points.length >= 2 ? { points, widths: widths ?? undefined } : null;
}

/** Fountain pen width factor: from stylus pressure if there is one, otherwise from speed (fast = thin). */
function widthFactor(pressure: number | null, speed: number): number {
  const t = pressure ?? 1 - clamp(speed / FOUNTAIN_FAST_SPEED, 0, 1);
  return lerp(FOUNTAIN_MIN_WIDTH, FOUNTAIN_MAX_WIDTH, t);
}

function lerpPoint(from: PagePoint, to: PagePoint, t: number): PagePoint {
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
}

/**
 * Ramer–Douglas–Peucker: the indices of the points to keep so the line never
 * moves more than `tolerance` away from the original. Iterative, so long strokes
 * can't overflow the stack.
 */
function simplify(points: PagePoint[], tolerance: number): number[] {
  const keep = new Set([0, points.length - 1]);
  const ranges: [number, number][] = [[0, points.length - 1]];
  while (ranges.length > 0) {
    const [first, last] = ranges.pop()!;
    let farthest = -1;
    let farthestDistance = tolerance;
    for (let i = first + 1; i < last; i++) {
      const d = distanceToSegment(points[i], points[first], points[last]);
      if (d > farthestDistance) {
        farthest = i;
        farthestDistance = d;
      }
    }
    if (farthest !== -1) {
      keep.add(farthest);
      ranges.push([first, farthest], [farthest, last]);
    }
  }
  return [...keep].sort((a, b) => a - b);
}

function distanceToSegment(point: PagePoint, a: PagePoint, b: PagePoint): number {
  const length = distance(a, b);
  if (length === 0) return distance(point, a);
  return Math.abs((b.x - a.x) * (a.y - point.y) - (a.x - point.x) * (b.y - a.y)) / length;
}

// --- Shapes ------------------------------------------------------------------

/** What to draw and save for a stroke, from its pen. */
export function strokeShape(stroke: InkAnnotation): StrokeShape {
  const pen = PENS[stroke.pen];
  const path = pen.filled
    ? outlinePath(stroke.points, stroke.widths ?? stroke.points.map(() => stroke.thickness))
    : pen.smooth
      ? curveThrough(stroke.points)
      : lineThrough(stroke.points);
  return { path, filled: pen.filled, opacity: pen.opacity, multiply: pen.multiply };
}

/** A stroke as the pdf module writes it: the same shape that's drawn on screen. */
export function toPdfStroke(stroke: InkAnnotation): PdfInkStroke {
  const { path, filled, opacity } = strokeShape(stroke);
  return {
    id: stroke.id,
    pageNumber: stroke.pageNumber,
    color: stroke.color,
    thickness: stroke.thickness,
    opacity,
    filled,
    path,
    points: stroke.points,
  };
}

/** Straight lines between the points. */
export function lineThrough(points: PathPoint[]): PdfPath {
  return { start: points[0], segments: points.slice(1).map((end) => ({ end })) };
}

/** A smooth curve through every point (Catmull-Rom, as cubic Bézier curves). */
export function curveThrough(points: PathPoint[]): PdfPath {
  return { start: points[0], segments: catmullRom(points) };
}

/** `points[index]`, with indices past either end reading the first or last point. */
function at(points: PathPoint[], index: number): PathPoint {
  return points[clamp(index, 0, points.length - 1)];
}

function catmullRom(points: PathPoint[]): PathSegment[] {
  return points.slice(1).map((end, i) => {
    const [before, from, after] = [at(points, i - 1), at(points, i), at(points, i + 2)];
    return {
      c1: { x: from.x + (end.x - before.x) / 6, y: from.y + (end.y - before.y) / 6 },
      c2: { x: end.x - (after.x - from.x) / 6, y: end.y - (after.y - from.y) / 6 },
      end,
    };
  });
}

/**
 * The closed outline of a line drawn with a different width at each point:
 * one side forwards, a round cap, the other side back, a round cap. Both sides
 * are smooth curves, so even a few points give a clean brush shape. A single
 * point (the moment the pen touches down) gives a round dot.
 */
function outlinePath(points: PathPoint[], widths: number[]): PdfPath {
  const left: PathPoint[] = [];
  const right: PathPoint[] = [];
  points.forEach((point, i) => {
    const direction = unit(at(points, i + 1), at(points, i - 1));
    const half = widths[i] / 2;
    left.push({ x: point.x - direction.y * half, y: point.y + direction.x * half });
    right.push({ x: point.x + direction.y * half, y: point.y - direction.x * half });
  });

  const last = points.length - 1;
  const forward = unit(points[last], at(points, last - 1));
  const backward = unit(points[0], at(points, 1));
  const rightBack = [...right].reverse();
  return {
    start: left[0],
    segments: [
      ...catmullRom(left),
      ...roundCap(left[last], points[last], right[last], forward),
      ...catmullRom(rightBack),
      ...roundCap(right[0], points[0], left[0], backward),
    ],
  };
}

/**
 * Half circle around `center` from `from` to `to`, bulging towards `direction`:
 * two quarter circles, each a cubic Bézier curve.
 */
function roundCap(from: PathPoint, center: PathPoint, to: PathPoint, direction: PathPoint): PathSegment[] {
  const radius = distance(from, center);
  const tip = { x: center.x + direction.x * radius, y: center.y + direction.y * radius };
  const quarter = (a: PathPoint, b: PathPoint): PathSegment => ({
    c1: { x: a.x + (b.x - center.x) * BEZIER_CIRCLE, y: a.y + (b.y - center.y) * BEZIER_CIRCLE },
    c2: { x: b.x + (a.x - center.x) * BEZIER_CIRCLE, y: b.y + (a.y - center.y) * BEZIER_CIRCLE },
    end: b,
  });
  return [quarter(from, tip), quarter(tip, to)];
}

/**
 * Unit vector from `from` to `to`. The same point has no direction; it gets a
 * fixed one, so a lone point still has width (and its two caps make a dot).
 */
function unit(to: PathPoint, from: PathPoint): PathPoint {
  const length = distance(to, from);
  return length === 0 ? { x: 1, y: 0 } : { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
}

/** SVG path data: "M … L … C … [Z]". */
export function toSvgPath({ start, segments }: PdfPath, closed = false): string {
  const xy = ({ x, y }: PathPoint) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const body = segments
    .map(({ c1, c2, end }) => (c1 && c2 ? `C${xy(c1)} ${xy(c2)} ${xy(end)}` : `L${xy(end)}`))
    .join("");
  return `M${xy(start)}${body}${closed ? "Z" : ""}`;
}
