import { toSvgPath } from "../ink.utils";
import type { InkShapeProps } from "../annotations.types";

/**
 * The visible ink of a stroke: a stroked line, or a filled outline (highlighter,
 * fountain pen). The same shape is what gets written into the PDF.
 */
export function InkShape({ shape, color, thickness }: InkShapeProps) {
  const style = shape.multiply ? { mixBlendMode: "multiply" as const } : undefined;
  if (shape.filled) {
    return (
      <path d={toSvgPath(shape.path, true)} fill={color} fillOpacity={shape.opacity} style={style} pointerEvents="none" />
    );
  }
  return (
    <path
      d={toSvgPath(shape.path)}
      fill="none"
      stroke={color}
      strokeOpacity={shape.opacity}
      strokeWidth={thickness}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      pointerEvents="none"
    />
  );
}
