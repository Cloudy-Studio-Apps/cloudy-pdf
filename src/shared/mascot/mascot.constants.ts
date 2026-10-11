/** Fixed geometry and palette of the mascot. Illustration colors, not UI tokens. */
import { generateSpots } from "./mascot.utils";
import type { FlipperPose, FlipperShape, Vec } from "./mascot.types";

export const SCENE_WIDTH = 120;
export const SCENE_HEIGHT = 96;

/** The seal's round body. Props are placed around it: left zone x < 30, right zone x > 90. */
export const SEAL_BODY = { cx: 60, cy: 60, rx: 30, ry: 28 } as const;

/** Area kept free of fur spots so the face stays readable at small sizes. */
export const SEAL_FACE = { cx: 60, cy: 52, rx: 14, ry: 10 } as const;

/** Eye centers; glasses use them too. */
export const SEAL_EYES: readonly Vec[] = [
  [52.5, 48],
  [67.5, 48],
];

/** Fur spots, generated once from a fixed seed so every render is identical. */
export const SEAL_SPOTS = generateSpots(140, 7, SEAL_BODY, SEAL_FACE);

/** Left-flipper ellipse for each pose (rx 4.5, ry 9). The right one is mirrored. */
export const FLIPPER_SHAPES: Record<FlipperPose, FlipperShape> = {
  rest: { cx: 33, cy: 74, rotate: 20 },
  hold: { cx: 47, cy: 77, rotate: -55 },
  up: { cx: 30, cy: 52, rotate: -35 },
  out: { cx: 27, cy: 66, rotate: -72 },
};

export const MASCOT_COLORS = {
  furLight: "#f1f3f6",
  furMid: "#c9d0d8",
  furDark: "#8e99a6",
  spot: "#5f6b79",
  flipper: "#7d8996",
  pale: "#f3f5f7",
  ink: "#1f2937",
  nose: "#3b4552",
  shadow: "#0f172a",
  paper: "#ffffff",
  paperEdge: "#cbd5e1",
  fold: "#e2e8f0",
  textLine: "#d4d8de",
  metal: "#64748b",
  metalLight: "#94a3b8",
  gold: "#eab308",
  wood: "#a16207",
  woodDark: "#78350f",
  sky: "#dbeafe",
} as const;
