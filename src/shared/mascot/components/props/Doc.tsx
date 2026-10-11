import { MASCOT_COLORS as C } from "../../mascot.constants";
import { toTransform } from "../../mascot.utils";
import type { DocProps } from "../../mascot.types";

/** A page with a folded corner, an optional colored label band and grey text lines. */
export function Doc({ w = 22, h = 28, color = C.metal, label, lines = 3, children, ...placement }: DocProps) {
  const left = -w / 2;
  const top = -h / 2;
  const fold = Math.min(6, w / 3);
  // Lines start under the label band when there is one.
  const firstLine = top + (label ? 13 : 5);

  return (
    <g transform={toTransform(placement)}>
      <path
        d={`M${left} ${top} H${-left - fold} L${-left} ${top + fold} V${-top} H${left} Z`}
        fill={C.paper}
        stroke={C.paperEdge}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path
        d={`M${-left - fold} ${top} V${top + fold} H${-left}`}
        fill={C.fold}
        stroke={C.paperEdge}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {label && (
        <>
          <rect x={left + 3} y={top + 4} width={label.length * 3.4 + 3} height="6" fill={color} />
          <text x={left + 4.5} y={top + 8.7} fontSize="4.6" fontWeight="700" fill="#ffffff">
            {label}
          </text>
        </>
      )}
      {Array.from({ length: lines }, (_, i) => (
        // Alternate long/short lines so it reads as text.
        <rect key={i} x={left + 3} y={firstLine + i * 4} width={(w - 6) * (i % 2 ? 0.7 : 1)} height="1.6" fill={C.textLine} />
      ))}
      {children}
    </g>
  );
}
