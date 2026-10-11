import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { PadlockProps } from "../../mascot.types";

/** Padlock. When `open`, the shackle's right leg is lifted out of the body. */
export function Padlock({ open = false, color = C.gold, ...placement }: PadlockProps) {
  const shackle = open ? "M-4.5 -2 V-9 a4.5 4.5 0 0 1 9 0 V-7" : "M-4.5 -2 V-6 a4.5 4.5 0 0 1 9 0 V-2";

  return (
    <g transform={toTransform(placement)}>
      <path d={shackle} fill="none" stroke={C.metal} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="-7" y="-2" width="14" height="11" fill={color} />
      <circle cy="2.6" r="1.6" fill={C.ink} />
      <rect x="-0.6" y="2.6" width="1.2" height="3.4" fill={C.ink} />
    </g>
  );
}
