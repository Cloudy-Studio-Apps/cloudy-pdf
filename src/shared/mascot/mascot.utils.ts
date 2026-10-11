/** Pure helpers for drawing the mascot (no React). */
import type { ArrowGeometry, Placement, SealSpot, Vec } from "./mascot.types";

interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** SVG transform for a prop drawn around (0, 0). */
export function toTransform({ x = 0, y = 0, rotate = 0, scale = 1 }: Placement): string {
  return `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`;
}

/** Tiny seeded random generator (mulberry32): same seed, same numbers, every time. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How far a point is inside an ellipse: < 1 inside, > 1 outside. */
const ellipseDistance = (x: number, y: number, e: Ellipse) => ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2;

/**
 * Speckled fur like the plush: `count` small spots inside `body`, none on `face`.
 * Seeded instead of Math.random so the seal looks the same on every render.
 */
export function generateSpots(count: number, seed: number, body: Ellipse, face: Ellipse): SealSpot[] {
  const random = seededRandom(seed);
  const spots: SealSpot[] = [];

  while (spots.length < count) {
    const cx = body.cx - body.rx + random() * body.rx * 2;
    const cy = body.cy - body.ry + random() * body.ry * 2;
    // Draw the random numbers before filtering, so the sequence stays stable.
    // Small, soft spots: big dark ones make the plush look like a cratered moon.
    const rx = 0.6 + random() * 1.2;
    const opacity = 0.15 + random() * 0.25;
    if (ellipseDistance(cx, cy, body) > 1 || ellipseDistance(cx, cy, face) < 1.3) continue;
    spots.push({ cx, cy, rx, ry: rx * 0.7, opacity });
  }
  return spots;
}

/**
 * A curved arrow from `from` to `to` (one quadratic curve). The control point sits
 * `bend` units off the midpoint, perpendicular to the line; the returned angle is
 * the curve's direction at the tip, used to point the arrowhead.
 */
export function arrowGeometry([x1, y1]: Vec, [x2, y2]: Vec, bend: number): ArrowGeometry {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 - (dy / length) * bend;
  const cy = (y1 + y2) / 2 + (dx / length) * bend;
  return {
    path: `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`,
    angle: (Math.atan2(y2 - cy, x2 - cx) * 180) / Math.PI,
  };
}
