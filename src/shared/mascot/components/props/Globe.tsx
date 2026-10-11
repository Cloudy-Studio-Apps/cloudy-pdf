import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** A globe: stands for web pages (HTML). */
export function Globe({ color = "#2563eb", ...placement }: ItemProps) {
  return (
    <g transform={toTransform(placement)} stroke={color} strokeWidth="1.3" fill="none">
      <circle r="9" fill="#dbeafe" />
      <ellipse rx="4" ry="9" />
      <line x1="-9" y1="0" x2="9" y2="0" />
      <path d="M-7.6 -4.6 H7.6 M-7.6 4.6 H7.6" />
    </g>
  );
}
