import type { ResizeHandleProps } from "../annotations.types";

/** A square corner handle of the selection box; dragging it scales the stroke. */
export function ResizeHandle({ x, y, size, cursor, handlers }: ResizeHandleProps) {
  return (
    <rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      fill="var(--color-surface)"
      stroke="var(--color-accent)"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      pointerEvents="all"
      className="touch-none"
      style={{ cursor }}
      {...handlers}
    />
  );
}
