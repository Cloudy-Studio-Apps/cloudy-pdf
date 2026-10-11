import { cn } from "@/shared/utils/class-names.utils";
import type { FocaWatonaProps } from "../home.types";

// Palette kept local: these are illustration colors, not UI tokens.
const FUR = "#9aaabd";
const FUR_DARK = "#8797ac";
const BELLY = "#d7e0ea";
const MUZZLE = "#e5ebf2";
const INK = "#1f2937";
const ICE = "#dbeafe";

/**
 * "Foca watona": the app mascot, a chubby (watona) seal (foca) sitting on an
 * ice floe, hugging a PDF. Inline SVG, so it scales crisply at any size and
 * needs no image file.
 *
 * Drawn back to front: sky → water → ice → seal (tail, body, belly,
 * document, flippers, face). The seal floats gently and blinks now and then
 * (`animate-float` / `animate-blink` in styles/index.css). `motion-safe:`
 * turns both off for users who ask the OS for reduced motion.
 */
export function FocaWatona({ className }: FocaWatonaProps) {
  return (
    <svg viewBox="0 0 420 340" role="img" aria-labelledby="foca-title" className={cn("select-none", className)}>
      <title id="foca-title">Foca watona, a chubby seal holding a PDF</title>

      {/* Sky disc and sparkles */}
      <circle cx="210" cy="165" r="150" fill="#eef6ff" />
      <g fill="#bfdbfe">
        <path d="M70 62 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" />
        <path d="M352 86 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
        <path d="M336 216 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z" />
      </g>

      {/* Water ripples */}
      <g fill="none" stroke="#bfdbfe" strokeWidth="3" strokeLinecap="round">
        <path d="M48 318 q15 -8 30 0 t30 0" />
        <path d="M300 322 q15 -8 30 0 t30 0 t30 0" />
        <path d="M150 330 q15 -8 30 0 t30 0" />
      </g>

      {/* Ice floe: top surface + thicker front edge */}
      <path d="M70 270 L110 248 L320 246 L355 268 L330 290 L95 292 Z" fill="#ffffff" stroke={ICE} strokeWidth="2" />
      <path d="M95 292 L330 290 L326 302 L100 304 Z" fill={ICE} />

      {/* Shadow stays on the ice while the seal floats */}
      <ellipse cx="212" cy="272" rx="96" ry="9" fill="#cbd5e1" opacity="0.6" />

      <g className="motion-safe:animate-float">
        {/* Tail flippers */}
        <ellipse cx="148" cy="262" rx="30" ry="11" fill={FUR_DARK} transform="rotate(-15 148 262)" />
        <ellipse cx="276" cy="262" rx="30" ry="11" fill={FUR_DARK} transform="rotate(15 276 262)" />

        {/* Body: round head + big round belly, joined by a neck ellipse */}
        <g fill={FUR}>
          <ellipse cx="212" cy="205" rx="108" ry="66" />
          <ellipse cx="212" cy="165" rx="80" ry="50" />
          <circle cx="212" cy="122" r="64" />
        </g>

        {/* Spots and a soft highlight on the head */}
        <g fill={FUR_DARK}>
          <ellipse cx="146" cy="196" rx="8" ry="5" />
          <ellipse cx="286" cy="204" rx="6" ry="4" />
          <ellipse cx="252" cy="80" rx="5" ry="3.5" />
          <ellipse cx="270" cy="170" rx="4" ry="3" />
        </g>
        <ellipse cx="188" cy="84" rx="20" ry="10" fill="#ffffff" opacity="0.2" transform="rotate(-20 188 84)" />

        {/* The "watona" part: a big pale belly with a belly button */}
        <ellipse cx="212" cy="218" rx="74" ry="48" fill={BELLY} />
        <path d="M206 250 q6 5 12 0" fill="none" stroke={FUR} strokeWidth="2.5" strokeLinecap="round" />

        {/* The PDF it's hugging */}
        <g transform="rotate(-8 212 196)">
          <rect x="182" y="160" width="60" height="72" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1.5" />
          <rect x="182" y="160" width="60" height="16" fill="#dc2626" />
          <text x="212" y="172" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1" fill="#ffffff">
            PDF
          </text>
          <g fill="#e4e4e7">
            <rect x="190" y="184" width="44" height="3" />
            <rect x="190" y="192" width="36" height="3" />
            <rect x="190" y="200" width="40" height="3" />
            <rect x="190" y="208" width="28" height="3" />
          </g>
        </g>

        {/* Front flippers holding the document */}
        <ellipse cx="174" cy="212" rx="12" ry="22" fill={FUR_DARK} transform="rotate(22 174 212)" />
        <ellipse cx="250" cy="203" rx="12" ry="22" fill={FUR_DARK} transform="rotate(-22 250 203)" />

        {/* Face */}
        <g fill="#fca5a5" opacity="0.55">
          <ellipse cx="174" cy="140" rx="10" ry="6" />
          <ellipse cx="250" cy="140" rx="10" ry="6" />
        </g>

        {/* Eyes: fill-box + origin-center make the blink squash each eye around its own middle */}
        <g className="origin-center [transform-box:fill-box] motion-safe:animate-blink">
          <circle cx="188" cy="115" r="9.5" fill={INK} />
          <circle cx="236" cy="115" r="9.5" fill={INK} />
          <circle cx="191" cy="111" r="3" fill="#ffffff" />
          <circle cx="239" cy="111" r="3" fill="#ffffff" />
        </g>

        {/* Muzzle, nose, smile */}
        <ellipse cx="203" cy="140" rx="13" ry="10" fill={MUZZLE} />
        <ellipse cx="221" cy="140" rx="13" ry="10" fill={MUZZLE} />
        <g fill="#94a3b8">
          <circle cx="198" cy="138" r="1.2" />
          <circle cx="204" cy="143" r="1.2" />
          <circle cx="220" cy="143" r="1.2" />
          <circle cx="226" cy="138" r="1.2" />
        </g>
        <ellipse cx="212" cy="132" rx="8" ry="5.5" fill={INK} />
        <ellipse cx="209.5" cy="130.5" rx="2" ry="1.2" fill="#ffffff" opacity="0.7" />
        <path d="M206 149 q6 5 12 0" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

        {/* Whiskers */}
        <g stroke="#64748b" strokeWidth="1.5" strokeLinecap="round">
          <path d="M192 138 L162 132" />
          <path d="M192 143 L160 145" />
          <path d="M193 148 L164 156" />
          <path d="M232 138 L262 132" />
          <path d="M232 143 L264 145" />
          <path d="M231 148 L260 156" />
        </g>
      </g>
    </svg>
  );
}
