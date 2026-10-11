import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A phone, screen facing us. */
export function Phone(placement: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <rect x="-6" y="-10" width="12" height="20" fill={C.ink} />
      <rect x="-4.8" y="-8" width="9.6" height="15" fill="#e0f2fe" />
      <circle cy="8.6" r="0.8" fill={C.metal} />
    </g>
  );
}
