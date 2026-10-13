import { ANNOTATION_ATTRIBUTE, HANDLE_SIZE, RESIZE_CORNERS, SELECTION_PADDING } from "../annotations.constants";
import { cornerPoint, resizeCursor, strokeBounds } from "../annotations.utils";
import type { SelectionBoxProps } from "../annotations.types";
import { ResizeHandle } from "./ResizeHandle";

/**
 * Dashed box around the selected stroke, with a resize handle on each corner.
 * The whole box can be grabbed to move the stroke, which is easier than hitting
 * the line itself, especially on touch.
 */
export function SelectionBox({ stroke, scale, rotation, transform }: SelectionBoxProps) {
  const ink = strokeBounds(stroke);
  const box = {
    minX: ink.minX - SELECTION_PADDING,
    minY: ink.minY - SELECTION_PADDING,
    maxX: ink.maxX + SELECTION_PADDING,
    maxY: ink.maxY + SELECTION_PADDING,
  };
  // The SVG is in page space, so dividing by the zoom keeps the handles the same size on screen.
  const handleSize = HANDLE_SIZE / scale;

  return (
    <g {...{ [ANNOTATION_ATTRIBUTE]: stroke.id }}>
      <rect
        x={box.minX}
        y={box.minY}
        width={box.maxX - box.minX}
        height={box.maxY - box.minY}
        fill="transparent"
        stroke="var(--color-accent)"
        strokeWidth={1}
        strokeDasharray="4 3"
        // Same 1px dashed line at every zoom.
        vectorEffect="non-scaling-stroke"
        pointerEvents="all"
        className="cursor-move touch-none"
        {...transform.bindMove(stroke)}
      />
      {RESIZE_CORNERS.map((corner) => {
        const { x, y } = cornerPoint(box, corner);
        return (
          <ResizeHandle
            key={corner}
            x={x}
            y={y}
            size={handleSize}
            cursor={resizeCursor(corner, rotation)}
            handlers={transform.bindResize(stroke, corner)}
          />
        );
      })}
    </g>
  );
}
