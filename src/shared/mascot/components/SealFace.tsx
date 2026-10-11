import { MASCOT_COLORS as C, SEAL_EYES } from "../mascot.constants";
import type { SealFaceProps } from "../mascot.types";

/** Eyes for each mood. All drawn around (0, 0), then placed on each eye center. */
const EYES = {
  // The plush's look: small dark eyes under a heavy lid.
  sleepy: (
    <>
      <ellipse rx="2.8" ry="1.7" fill={C.ink} />
      <path d="M-3.4 -1.2 q3.4 -1.6 6.8 0" fill="none" stroke={C.ink} strokeWidth="0.9" strokeLinecap="round" />
    </>
  ),
  // Closed, smiling arcs (^ ^).
  happy: <path d="M-2.8 0.8 q2.8 -3.6 5.6 0" fill="none" stroke={C.ink} strokeWidth="1.3" strokeLinecap="round" />,
  // Wide awake: round eyes with a shine.
  focused: (
    <>
      <circle r="2.8" fill={C.ink} />
      <circle cx="0.9" cy="-0.9" r="0.9" fill="#ffffff" />
    </>
  ),
};

/** The seal's face: soft eye shading, eyes, muzzle with whisker dots, nose, and the low smile line. */
export function SealFace({ mood }: SealFaceProps) {
  return (
    <g>
      {/* Slightly darker fur around the eyes, like the plush. */}
      {SEAL_EYES.map(([x, y]) => (
        <ellipse key={`shade-${x}`} cx={x} cy={y} rx="5" ry="3.6" fill={C.furDark} opacity="0.25" />
      ))}
      {SEAL_EYES.map(([x, y]) => (
        <g key={`eye-${x}`} transform={`translate(${x} ${y})`}>
          {EYES[mood]}
        </g>
      ))}

      <ellipse cx="57" cy="55.5" rx="4.2" ry="3.4" fill={C.pale} />
      <ellipse cx="63" cy="55.5" rx="4.2" ry="3.4" fill={C.pale} />
      <g fill={C.furDark}>
        <circle cx="55.6" cy="55" r="0.45" />
        <circle cx="57.4" cy="56.8" r="0.45" />
        <circle cx="62.6" cy="56.8" r="0.45" />
        <circle cx="64.4" cy="55" r="0.45" />
      </g>
      <ellipse cx="60" cy="52.4" rx="2.8" ry="1.9" fill={C.nose} />

      {/* The plush's signature: a faint smile line low on the belly. */}
      <path d="M52 65 q8 3.6 16 0" fill="none" stroke={C.furDark} strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}
