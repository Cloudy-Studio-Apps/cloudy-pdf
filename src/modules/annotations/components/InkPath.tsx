import { useMemo } from "react";
import { ANNOTATION_ATTRIBUTE, HIT_PADDING } from "../annotations.constants";
import { toSvgPath } from "../annotations.utils";
import type { InkPathProps } from "../annotations.types";

/**
 * One stroke. In select mode a wider, invisible copy of the path is the part
 * that catches presses, so thin lines are easy to grab.
 */
export function InkPath({ stroke, interactive, transform }: InkPathProps) {
  const d = useMemo(() => toSvgPath(stroke.points), [stroke.points]);

  return (
    <g {...{ [ANNOTATION_ATTRIBUTE]: stroke.id }}>
      <path
        d={d}
        fill="none"
        stroke={stroke.color}
        strokeWidth={stroke.thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="none"
      />
      {interactive && (
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={stroke.thickness + HIT_PADDING * 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="stroke"
          className="cursor-move touch-none"
          {...transform.bindMove(stroke)}
        />
      )}
    </g>
  );
}
