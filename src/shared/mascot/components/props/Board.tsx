import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A presentation board on a stand, with a little bar chart: stands for slides (PowerPoint). */
export function Board({ color = "#ea580c", ...placement }: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <path d="M-6 6 L-9 14 M6 6 L9 14" stroke={C.metal} strokeWidth="1.4" strokeLinecap="round" />
      <rect x="-12" y="-9" width="24" height="16" fill={C.paper} stroke={C.paperEdge} strokeWidth="0.8" />
      <rect x="-12" y="-9" width="24" height="3" fill={color} />
      <g fill={color} opacity="0.7">
        <rect x="-7" y="0" width="3" height="5" />
        <rect x="-2" y="-3" width="3" height="8" />
        <rect x="3" y="-1" width="3" height="6" />
      </g>
    </g>
  );
}
