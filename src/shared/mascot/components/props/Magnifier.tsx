import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** Magnifying glass: lens at (0, 0), handle toward the bottom right. */
export function Magnifier(placement: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <line x1="5" y1="5" x2="12" y2="12" stroke={C.metal} strokeWidth="3.4" strokeLinecap="round" />
      <circle r="7" fill="#e0f2fe" fillOpacity="0.55" stroke={C.metal} strokeWidth="2.2" />
      <path d="M-4 -2 a4.5 4.5 0 0 1 3 -3" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}
