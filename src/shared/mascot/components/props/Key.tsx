import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A key pointing along +x (bit at the right end). */
export function Key({ color = C.gold, ...placement }: ItemProps) {
  return (
    <g transform={toTransform(placement)} stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none">
      <circle cx="-7" r="3.8" />
      <line x1="-3.2" y1="0" x2="10" y2="0" />
      <line x1="6.5" y1="0" x2="6.5" y2="3.4" />
      <line x1="9.5" y1="0" x2="9.5" y2="3.8" />
    </g>
  );
}
