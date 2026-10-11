/** Scenes for the "Edit PDF" tools. */
import { SealScene } from "@/shared/mascot/components/SealScene";
import { Arrow } from "@/shared/mascot/components/props/Arrow";
import { Doc } from "@/shared/mascot/components/props/Doc";
import { Pencil } from "@/shared/mascot/components/props/Pencil";
import { Scissors } from "@/shared/mascot/components/props/Scissors";
import { Sparkle } from "@/shared/mascot/components/props/Sparkle";
import { Stamp } from "@/shared/mascot/components/props/Stamp";
import type { ToolSceneProps } from "../../tools.types";

/** The seal turns a tilted page, with arrows circling around it. */
export function RotateScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      left="hold"
      right="hold"
      behind={
        <>
          <Arrow from={[16, 74]} to={[22, 34]} bend={-10} color={color} />
          <Arrow from={[104, 34]} to={[98, 74]} bend={-10} color={color} />
        </>
      }
      front={<Doc x={60} y={77} w={20} h={20} rotate={24} label="PDF" color={color} lines={1} />}
    />
  );
}

/** A fan of pages, each numbered at the bottom. */
export function PageNumbersScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      right="up"
      behind={
        <>
          {["1", "2", "3"].map((n, i) => (
            <Doc key={n} x={92 + i * 10} y={74 - i * 5} w={15} h={20} rotate={-8 + i * 8} lines={2}>
              <text y="8" textAnchor="middle" fontSize="5" fontWeight="700" fill={color}>
                {n}
              </text>
            </Doc>
          ))}
        </>
      }
      front={<Sparkle x={84} y={28} color={color} />}
    />
  );
}

/** The seal stamps a watermark onto a page. */
export function WatermarkScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      right="up"
      behind={
        <Doc x={103} y={74} w={22} h={22} lines={0}>
          <circle r="6" fill="none" stroke={color} strokeWidth="1.2" opacity="0.55" />
          <path d="M-3 0 l2 2 l4 -4" fill="none" stroke={color} strokeWidth="1.2" opacity="0.55" />
        </Doc>
      }
      front={<Stamp x={100} y={44} color={color} />}
    />
  );
}

/** Scissors trim a page along dashed crop marks. */
export function CropScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      right="out"
      behind={
        <Doc x={104} y={58} w={22} h={30} lines={0}>
          <rect x="-7" y="-9" width="12" height="16" fill="none" stroke={color} strokeWidth="0.9" strokeDasharray="2 1.5" />
        </Doc>
      }
      front={<Scissors x={96} y={78} rotate={-30} color={color} />}
    />
  );
}

/** The seal writes on the page it's holding. */
export function EditScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      left="hold"
      right="up"
      front={
        <>
          <Doc x={58} y={78} w={22} h={18} lines={1}>
            <path d="M-7 4 q2 -3 4 0 t4 0 t4 0" fill="none" stroke={color} strokeWidth="1" />
          </Doc>
          <Pencil x={78} y={62} rotate={135} color={color} />
        </>
      }
    />
  );
}

/** A form with checkboxes, one already ticked. */
export function FormsScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      right="out"
      front={
        <Doc x={104} y={60} w={22} h={30} lines={0}>
          {[-6, 1, 8].map((y, i) => (
            <g key={y} transform={`translate(0 ${y})`}>
              <rect x="-7" y="-2" width="4" height="4" fill="none" stroke="#94a3b8" strokeWidth="0.7" />
              {i === 0 && <path d="M-6.4 0 l1.2 1.2 l2.4 -2.8" fill="none" stroke={color} strokeWidth="1" />}
              <rect x="-1" y="-0.8" width="8" height="1.6" fill="#d4d8de" />
            </g>
          ))}
        </Doc>
      }
    />
  );
}
