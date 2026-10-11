import { cn } from "@/shared/utils/class-names.utils";
import { MASCOT_COLORS as C, SCENE_HEIGHT, SCENE_WIDTH, SEAL_BODY } from "../mascot.constants";
import { SealBody } from "./SealBody";
import { SealFlippers } from "./SealFlippers";
import type { SealSceneProps } from "../mascot.types";

/**
 * One mascot illustration: the seal plus whatever props a scene adds.
 * Layer order is what makes the poses read right: props in `front` sit on the
 * belly, and the flippers are drawn over them so they look held.
 */
export function SealScene({
  behind,
  front,
  left = "rest",
  right = "rest",
  mood = "sleepy",
  className,
}: SealSceneProps) {
  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      aria-hidden="true"
      className={cn("select-none", className)}
    >
      <ellipse cx={SEAL_BODY.cx} cy="90" rx="38" ry="3.5" fill={C.shadow} opacity="0.08" />
      {behind}
      <SealBody mood={mood} />
      {front}
      <SealFlippers left={left} right={right} />
    </svg>
  );
}
