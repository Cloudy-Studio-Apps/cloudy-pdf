import { toTransform } from "../../mascot.utils";
import type { SpeechBubbleProps } from "../../mascot.types";

/** A speech bubble with short text. The tail points down-left (or down-right with `flip`). */
export function SpeechBubble({ text, flip = false, color = "#db2777", ...placement }: SpeechBubbleProps) {
  const tail = flip ? "4,5 9,10 8,5" : "-4,5 -9,10 -8,5";

  return (
    <g transform={toTransform(placement)}>
      <rect x="-12" y="-7" width="24" height="12" fill="#ffffff" stroke={color} strokeWidth="1.4" />
      <polygon points={tail} fill="#ffffff" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Re-cover the bubble's bottom edge where the tail joins it. */}
      <line x1={flip ? 4.6 : -7.4} y1="5" x2={flip ? 7.4 : -4.6} y2="5" stroke="#ffffff" strokeWidth="1.6" />
      <text y="1.9" textAnchor="middle" fontSize="6" fontWeight="700" fill={color}>
        {text}
      </text>
    </g>
  );
}
