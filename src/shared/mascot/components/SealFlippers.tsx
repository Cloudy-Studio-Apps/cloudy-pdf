import { FLIPPER_SHAPES, MASCOT_COLORS as C, SEAL_BODY } from "../mascot.constants";
import type { SealFlippersProps } from "../mascot.types";

/** Front flippers. Shapes are defined for the left side; the right one is mirrored across the body's center. */
export function SealFlippers({ left, right }: SealFlippersProps) {
  const l = FLIPPER_SHAPES[left];
  const r = FLIPPER_SHAPES[right];
  const mirroredX = SEAL_BODY.cx * 2 - r.cx;

  return (
    <g fill={C.flipper}>
      <ellipse cx={l.cx} cy={l.cy} rx="4.5" ry="9" transform={`rotate(${l.rotate} ${l.cx} ${l.cy})`} />
      <ellipse cx={mirroredX} cy={r.cy} rx="4.5" ry="9" transform={`rotate(${-r.rotate} ${mirroredX} ${r.cy})`} />
    </g>
  );
}
