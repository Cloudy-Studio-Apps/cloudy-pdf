import { useMemo } from "react";
import { ANNOTATION_ATTRIBUTE, HIT_PADDING } from "../annotations.constants";
import { inkRadius } from "../annotations.utils";
import { lineThrough, strokeShape, toSvgPath } from "../ink.utils";
import type { InkPathProps } from "../annotations.types";
import { InkShape } from "./InkShape";

/**
 * One stroke. In select mode a wider, invisible copy of its centre line is the
 * part that catches presses, so thin lines are easy to grab.
 */
export function InkPath({ stroke, interactive, transform }: InkPathProps) {
  const shape = useMemo(() => strokeShape(stroke), [stroke]);
  const hitPath = useMemo(() => toSvgPath(lineThrough(stroke.points)), [stroke.points]);

  return (
    <g {...{ [ANNOTATION_ATTRIBUTE]: stroke.id }}>
      <InkShape shape={shape} color={stroke.color} thickness={stroke.thickness} />
      {interactive && (
        <path
          d={hitPath}
          fill="none"
          stroke="transparent"
          strokeWidth={(inkRadius(stroke) + HIT_PADDING) * 2}
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
