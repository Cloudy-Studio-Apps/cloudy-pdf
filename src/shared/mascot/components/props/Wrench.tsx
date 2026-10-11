import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A wrench along +x, with its open jaw at the right end. */
export function Wrench(placement: ItemProps) {
  return (
    <g transform={toTransform(placement)} stroke={C.metal} fill="none" strokeLinecap="round">
      <line x1="-10" y1="0" x2="5" y2="0" strokeWidth="3.6" />
      <path d="M11.5 -3.4 A4.6 4.6 0 1 0 11.5 3.4" strokeWidth="3.4" />
    </g>
  );
}
