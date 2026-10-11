/** Scenes for the "Optimize PDF" tools. */
import { SealScene } from "@/shared/mascot/components/SealScene";
import { Arrow } from "@/shared/mascot/components/props/Arrow";
import { Doc } from "@/shared/mascot/components/props/Doc";
import { Magnifier } from "@/shared/mascot/components/props/Magnifier";
import { Sparkle } from "@/shared/mascot/components/props/Sparkle";
import { Wrench } from "@/shared/mascot/components/props/Wrench";
import type { ToolSceneProps } from "../../tools.types";

/** The seal squeezes a page flat between its flippers. */
export function CompressScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      left="hold"
      right="hold"
      behind={
        <>
          <Arrow from={[6, 76]} to={[26, 76]} color={color} />
          <Arrow from={[114, 76]} to={[94, 76]} color={color} />
        </>
      }
      front={
        // Wide and short: a squashed page. No label, the flippers would hide it.
        <Doc x={60} y={78} w={34} h={12} lines={2} />
      }
    />
  );
}

/** A bandaged page in one flipper, a wrench in the other. */
export function RepairScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      left="hold"
      right="out"
      front={
        <>
          <Doc x={58} y={78} w={22} h={18} lines={1}>
            {/* Bandage: a pale strip with a pad, across the page. */}
            <g transform="rotate(-30)">
              <rect x="-10" y="-2.4" width="20" height="4.8" fill="#fcd9b6" />
              <rect x="-3" y="-2.4" width="6" height="4.8" fill="#f5b78a" />
            </g>
          </Doc>
          <Wrench x={102} y={56} rotate={-40} />
          <Sparkle x={86} y={34} color={color} />
        </>
      }
    />
  );
}

/** The seal reads a scanned page through a magnifying glass, finding real text. */
export function OcrScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      right="out"
      behind={
        <Doc x={104} y={58} w={22} h={30} lines={0}>
          <text y="-2" textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>
            Aa
          </text>
          <rect x="-7" y="4" width="14" height="1.6" fill="#d4d8de" />
          <rect x="-7" y="8" width="10" height="1.6" fill="#d4d8de" />
        </Doc>
      }
      front={<Magnifier x={100} y={52} rotate={90} />}
    />
  );
}
