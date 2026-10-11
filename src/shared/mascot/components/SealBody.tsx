import { useId } from "react";
import { MASCOT_COLORS as C, SEAL_BODY, SEAL_SPOTS } from "../mascot.constants";
import { SealFace } from "./SealFace";
import type { SealBodyProps } from "../mascot.types";

/**
 * The round plush seal seen from the front: bottom flippers, spotted round body,
 * pale underside and face. Front flippers are separate (SealFlippers) so scenes
 * can draw props between the body and the flippers.
 */
export function SealBody({ mood }: SealBodyProps) {
  // Gradient and clip ids are global to the page and many seals are on screen at
  // once, so each instance gets its own. useId may contain characters that break
  // `url(#…)`, so keep only plain ones.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = { fur: `${uid}-fur`, belly: `${uid}-belly`, clip: `${uid}-clip` };
  const { cx, cy, rx, ry } = SEAL_BODY;

  return (
    <g>
      <defs>
        {/* Light from the top gives the ball its squishy volume. */}
        <radialGradient id={ids.fur} cx="0.45" cy="0.3" r="0.75">
          <stop offset="0" stopColor={C.furLight} />
          <stop offset="0.65" stopColor={C.furMid} />
          <stop offset="1" stopColor={C.furDark} />
        </radialGradient>
        {/* Pale underside fading in, instead of a hard belly line. */}
        <linearGradient id={ids.belly} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.7" stopColor={C.pale} stopOpacity="0" />
          <stop offset="1" stopColor={C.pale} stopOpacity="0.9" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>

      {/* Bottom flippers, peeking out under the body. */}
      <g fill={C.flipper}>
        <ellipse cx="48" cy="87" rx="6.5" ry="3.2" transform="rotate(-12 48 87)" />
        <ellipse cx="72" cy="87" rx="6.5" ry="3.2" transform="rotate(12 72 87)" />
      </g>

      <g clipPath={`url(#${ids.clip})`}>
        <rect x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} fill={`url(#${ids.fur})`} />
        <g fill={C.spot}>
          {SEAL_SPOTS.map((spot) => (
            <ellipse key={`${spot.cx}-${spot.cy}`} {...spot} />
          ))}
        </g>
        <rect x={cx - rx} y={cy - ry} width={rx * 2} height={ry * 2} fill={`url(#${ids.belly})`} />
      </g>

      <SealFace mood={mood} />
    </g>
  );
}
