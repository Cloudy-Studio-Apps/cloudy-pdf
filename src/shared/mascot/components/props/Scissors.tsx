import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** Open scissors, blades pointing along +x. */
export function Scissors({ color = "#ef4444", ...placement }: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <line x1="-4" y1="-3" x2="12" y2="3" stroke={C.metalLight} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="-4" y1="3" x2="12" y2="-3" stroke={C.metalLight} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="-7" cy="-4" r="3" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="-7" cy="4" r="3" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="3" r="1" fill={C.metal} />
    </g>
  );
}
