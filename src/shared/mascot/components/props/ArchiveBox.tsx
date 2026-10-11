import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A cardboard archive box: stands for long-term storage (PDF/A). */
export function ArchiveBox(placement: ItemProps) {
  return (
    <g transform={toTransform(placement)}>
      <rect x="-10" y="-3" width="20" height="13" fill="#d6a76c" />
      <rect x="-11" y="-8" width="22" height="5" fill="#c08a4a" />
      <rect x="-3.5" y="0.5" width="7" height="2.4" fill={C.woodDark} opacity="0.6" />
    </g>
  );
}
