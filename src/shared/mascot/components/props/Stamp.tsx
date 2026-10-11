import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A rubber stamp, handle up, rubber face (in `color`) at the bottom (y ≈ 4). */
export function Stamp({ color = "#9333ea", ...placement }: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <circle cy="-11" r="3.6" fill={C.wood} />
      <rect x="-1.8" y="-8.5" width="3.6" height="6.5" fill={C.wood} />
      <rect x="-7.5" y="-2.5" width="15" height="4.5" fill={C.woodDark} />
      <rect x="-8" y="2" width="16" height="2.4" fill={color} />
    </g>
  );
}
