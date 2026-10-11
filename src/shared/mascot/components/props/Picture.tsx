import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A photo (sky, sun, mountains): stands for JPG images. */
export function Picture(placement: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <rect x="-11" y="-9" width="22" height="18" fill={C.paper} stroke={C.paperEdge} strokeWidth="0.8" />
      <rect x="-9" y="-7" width="18" height="14" fill={C.sky} />
      <circle cx="4.5" cy="-3" r="2.2" fill="#fbbf24" />
      <polygon points="-9,7 -3,-1 2,5 4.5,2.5 9,7" fill="#4ade80" />
    </g>
  );
}
