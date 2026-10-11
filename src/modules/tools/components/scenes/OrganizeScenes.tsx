/** Scenes for the "Organize PDF" tools. Each is the seal doing that tool's job. */
import { SealScene } from "@/shared/mascot/components/SealScene";
import { Arrow } from "@/shared/mascot/components/props/Arrow";
import { Doc } from "@/shared/mascot/components/props/Doc";
import { Phone } from "@/shared/mascot/components/props/Phone";
import { Sparkle } from "@/shared/mascot/components/props/Sparkle";
import type { ToolSceneProps } from "../../tools.types";

/** Two pages fly in from the sides and become the one PDF the seal hugs. */
export function MergeScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      left="hold"
      right="hold"
      behind={
        <>
          <Doc x={15} y={30} w={16} h={20} rotate={-14} lines={2} />
          <Doc x={105} y={30} w={16} h={20} rotate={14} lines={2} />
          <Arrow from={[20, 44]} to={[44, 66]} bend={6} color={color} />
          <Arrow from={[100, 44]} to={[76, 66]} bend={-6} color={color} />
        </>
      }
      front={<Doc x={60} y={77} w={22} h={20} label="PDF" color={color} lines={1} />}
    />
  );
}

/** Torn page edge, drawn on a half page (local coordinates). */
const TearEdge = ({ side }: { side: 1 | -1 }) => (
  <path
    d={`M${side * 8} -12 l${side * -2} 3 l${side * 2} 3 l${side * -2} 3 l${side * 2} 3 l${side * -2} 3 l${side * 2} 3 l${side * -2} 3`}
    fill="none"
    stroke="#94a3b8"
    strokeWidth="0.8"
  />
);

/** The seal pulls a page apart, one half in each flipper. */
export function SplitScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      left="out"
      right="out"
      front={
        <>
          <Doc x={16} y={60} w={18} h={24} rotate={-12} label="P" color={color} lines={2}>
            <TearEdge side={1} />
          </Doc>
          <Doc x={104} y={60} w={18} h={24} rotate={12} label="DF" color={color} lines={2}>
            <TearEdge side={-1} />
          </Doc>
          <Sparkle x={34} y={36} color={color} />
          <Sparkle x={86} y={36} scale={0.7} color={color} />
        </>
      }
    />
  );
}

/** The seal tosses away a page marked with a big minus. */
export function RemovePagesScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      right="up"
      behind={
        <>
          <Arrow from={[86, 40]} to={[98, 28]} bend={-4} color={color} />
          <Doc x={106} y={18} w={16} h={20} rotate={24} lines={2}>
            <circle cy="4" r="5" fill={color} />
            <rect x="-3" y="3.2" width="6" height="1.6" fill="#ffffff" />
          </Doc>
        </>
      }
      front={<Doc x={60} y={78} w={20} h={18} lines={2} />}
    />
  );
}

/** One page is lifted out of a stack and carried to the side. */
export function ExtractPagesScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      right="out"
      behind={
        <>
          <Doc x={13} y={70} w={18} h={22} rotate={-4} lines={0} />
          <Doc x={16} y={68} w={18} h={22} rotate={-2} lines={2} />
          <Arrow from={[20, 50]} to={[100, 42]} bend={-24} color={color} />
        </>
      }
      front={<Doc x={104} y={64} w={18} h={22} rotate={8} label="1" color={color} lines={2} />}
    />
  );
}

/** Numbered pages around the seal, with arrows swapping their order. */
export function OrganizeScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      left="up"
      right="up"
      behind={
        <>
          {[
            { x: 13, y: 28, n: "3" },
            { x: 107, y: 28, n: "1" },
            { x: 13, y: 70, n: "2" },
            { x: 107, y: 70, n: "4" },
          ].map(({ x, y, n }) => (
            <Doc key={n} x={x} y={y} w={14} h={18} lines={0}>
              <text y="3" textAnchor="middle" fontSize="8" fontWeight="700" fill={color}>
                {n}
              </text>
            </Doc>
          ))}
          <Arrow from={[22, 20]} to={[98, 20]} bend={-6} color={color} />
          <Arrow from={[98, 36]} to={[22, 36]} bend={-6} color={color} />
        </>
      }
    />
  );
}

/** The seal holds a phone up and scans a page with a light beam. */
export function ScanScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="focused"
      right="up"
      behind={
        <>
          <polygon points="98,30 92,66 116,66" fill={color} opacity="0.15" />
          <Doc x={104} y={76} w={20} h={18} lines={2} />
          <line x1="94" y1="62" x2="114" y2="62" stroke={color} strokeWidth="1.2" />
        </>
      }
      front={<Phone x={98} y={26} rotate={10} />}
    />
  );
}
