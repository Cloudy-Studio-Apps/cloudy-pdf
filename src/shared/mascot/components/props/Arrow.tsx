import { arrowGeometry } from "../../mascot.utils";
import type { ArrowProps } from "../../mascot.types";

/** A (optionally curved) arrow, used to show what a tool does: merge in, split apart, convert across. */
export function Arrow({ from, to, bend = 0, color }: ArrowProps) {
  const { path, angle } = arrowGeometry(from, to, bend);

  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 3.6" />
      <polygon points="0,0 -5,-3.2 -5,3.2" fill={color} transform={`translate(${to[0]} ${to[1]}) rotate(${angle})`} />
    </g>
  );
}
