/** Scenes for the "PDF Security" tools. */
import { SealScene } from "@/shared/mascot/components/SealScene";
import { Doc } from "@/shared/mascot/components/props/Doc";
import { Glasses } from "@/shared/mascot/components/props/Glasses";
import { Key } from "@/shared/mascot/components/props/Key";
import { Padlock } from "@/shared/mascot/components/props/Padlock";
import { Pencil } from "@/shared/mascot/components/props/Pencil";
import { Sparkle } from "@/shared/mascot/components/props/Sparkle";
import type { ToolSceneProps } from "../../tools.types";

/** The seal turns a key and the padlock pops open. */
export function UnlockScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      right="out"
      front={
        <>
          <Padlock x={106} y={58} open scale={1.3} color={color} />
          <Key x={88} y={70} rotate={-20} />
          <Sparkle x={112} y={38} color={color} />
        </>
      }
    />
  );
}

/** The seal hugs its PDF tight, padlock on. */
export function ProtectScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      left="hold"
      right="hold"
      front={
        <>
          <Doc x={60} y={77} w={22} h={20} label="PDF" color={color} lines={1} />
          {/* Centered between the flippers, so it stays visible. */}
          <Padlock x={60} y={80} scale={0.7} color={color} />
        </>
      }
    />
  );
}

/** The seal signs a page with a flourish. */
export function SignScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      right="up"
      behind={
        <Doc x={104} y={70} w={22} h={28} lines={2}>
          <path d="M-8 9 c2 -6 4 -6 4 0 s3 -5 4 -2 s2 3 7 -2" fill="none" stroke={color} strokeWidth="1" />
          <line x1="-8" y1="11" x2="8" y2="11" stroke="#94a3b8" strokeWidth="0.5" />
        </Doc>
      }
      front={<Pencil x={92} y={60} rotate={60} color={color} />}
    />
  );
}

/** Seal in sunglasses holding a page with blacked-out lines. Top secret. */
export function RedactScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      right="out"
      front={
        <>
          <Glasses kind="sun" />
          <Doc x={104} y={60} w={22} h={30} label="PDF" color={color} lines={0}>
            <rect x="-8" y="0" width="16" height="2.4" fill="#1f2937" />
            <rect x="-8" y="4" width="10" height="1.6" fill="#d4d8de" />
            <rect x="-8" y="7.5" width="13" height="2.4" fill="#1f2937" />
          </Doc>
        </>
      }
    />
  );
}

/** Seal in reading glasses, one page in each flipper, spotting the difference. */
export function CompareScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      left="out"
      right="out"
      front={
        <>
          <Glasses kind="reading" />
          <Doc x={16} y={60} w={18} h={24} rotate={-6} lines={3} />
          <Doc x={104} y={60} w={18} h={24} rotate={6} lines={3}>
            <rect x="-6" y="-1.2" width="12" height="2.4" fill={color} opacity="0.35" />
          </Doc>
        </>
      }
    />
  );
}
