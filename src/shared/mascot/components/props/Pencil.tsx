import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A pencil pointing along +x (tip at x = 15). Rotate it to aim the tip at a page. */
export function Pencil({ color = "#facc15", ...placement }: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <rect x="-13" y="-2.5" width="3" height="5" fill="#f9a8b4" />
      <rect x="-10" y="-2.5" width="2" height="5" fill="#94a3b8" />
      <rect x="-8" y="-2.5" width="18" height="5" fill={color} />
      <polygon points="10,-2.5 15,0 10,2.5" fill="#fde68a" />
      <polygon points="13.4,-0.8 15,0 13.4,0.8" fill="#334155" />
    </g>
  );
}
