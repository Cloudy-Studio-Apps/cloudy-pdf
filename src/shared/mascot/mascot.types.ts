/** Types for the mascot: the chubby seal ("foca watona") and the props it plays with. */
import type { ReactNode } from "react";

/** A point in scene coordinates (the scene's viewBox is 120 × 96). */
export type Vec = readonly [x: number, y: number];

/** Face expression. "sleepy" is the plush's resting face (half-closed eyes). */
export type SealMood = "sleepy" | "happy" | "focused";

/**
 * Where a front flipper is.
 * - rest: hanging at the side
 * - hold: in front of the belly, gripping whatever is held there
 * - up: raised to the side (cheering, holding something high)
 * - out: stretched sideways, holding something beside the seal
 */
export type FlipperPose = "rest" | "hold" | "up" | "out";

/** An ellipse that draws one flipper, for the left side (the right side is mirrored). */
export interface FlipperShape {
  cx: number;
  cy: number;
  rotate: number;
}

export interface SealSpot {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
}

/** Position of a prop. Props are drawn around their own (0, 0), then moved here. */
export interface Placement {
  x?: number;
  y?: number;
  rotate?: number;
  scale?: number;
}

/**
 * One illustration: the seal plus props.
 * Layers, back to front: `behind` → seal → `front` → flippers. Drawing the flippers
 * last makes them overlap whatever is in `front`, which reads as gripping it.
 */
export interface SealSceneProps {
  behind?: ReactNode;
  front?: ReactNode;
  left?: FlipperPose;
  right?: FlipperPose;
  mood?: SealMood;
  className?: string;
}

export interface SealBodyProps {
  mood: SealMood;
}

export interface SealFaceProps {
  mood: SealMood;
}

export interface SealFlippersProps {
  left: FlipperPose;
  right: FlipperPose;
}

export interface DocProps extends Placement {
  w?: number;
  h?: number;
  /** Color of the label band. */
  color?: string;
  /** Short text on the band, e.g. "PDF", "W". */
  label?: string;
  /** Number of grey text lines. */
  lines?: number;
  /** Extra marks drawn on the page, in the page's own coordinates (centered at 0, 0). */
  children?: ReactNode;
}

export interface ArrowProps {
  from: Vec;
  to: Vec;
  /** Curvature: 0 is straight; the sign picks which side the curve bulges to. */
  bend?: number;
  color: string;
}

/** Props for a simple item that only needs a position and an accent color. */
export interface ItemProps extends Placement {
  color?: string;
}

export interface PadlockProps extends ItemProps {
  open?: boolean;
}

export interface SpeechBubbleProps extends ItemProps {
  text: string;
  /** Put the tail on the right instead of the left. */
  flip?: boolean;
}

export interface GlassesProps {
  kind: "sun" | "reading";
}

export interface ArrowGeometry {
  path: string;
  /** Direction at the tip, in degrees, to rotate the arrowhead. */
  angle: number;
}
