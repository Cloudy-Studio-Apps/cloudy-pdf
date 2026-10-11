import { MASCOT_COLORS as C, SEAL_EYES } from "../../mascot.constants";
import type { GlassesProps } from "../../mascot.types";

/** Glasses worn by the seal, fixed on its eyes: dark sunglasses or round reading glasses. */
export function Glasses({ kind }: GlassesProps) {
  const [[lx, ly], [rx, ry]] = SEAL_EYES;
  const isSun = kind === "sun";
  const lens = isSun
    ? { fill: C.ink, stroke: C.ink }
    : { fill: "#e0f2fe", fillOpacity: 0.35, stroke: C.ink };

  return (
    <g strokeWidth="1">
      <line x1={lx + 4} y1={ly} x2={rx - 4} y2={ry} stroke={C.ink} />
      {isSun ? (
        <>
          <rect x={lx - 4.5} y={ly - 3} width="9" height="6" {...lens} />
          <rect x={rx - 4.5} y={ry - 3} width="9" height="6" {...lens} />
        </>
      ) : (
        <>
          <circle cx={lx} cy={ly} r="4" {...lens} />
          <circle cx={rx} cy={ry} r="4" {...lens} />
        </>
      )}
    </g>
  );
}
