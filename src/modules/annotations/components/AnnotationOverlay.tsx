import { useCallback, useMemo, useRef } from "react";
import { cn } from "@/shared/utils/class-names.utils";
import { useAnnotationsLayer } from "../hooks/useAnnotationsLayer";
import { useStrokeDrawing } from "../hooks/useStrokeDrawing";
import { useStrokeTransform } from "../hooks/useStrokeTransform";
import { pageTransform, toSvgPath } from "../annotations.utils";
import type { AnnotationOverlayProps, PagePoint } from "../annotations.types";
import { InkPath } from "./InkPath";
import { SelectionBox } from "./SelectionBox";

/**
 * One page's annotations, as an SVG over the page (above the text and form
 * layers). Its viewBox is the page at 100%, so it scales with the zoom for free;
 * the inner group rotates page space with the view.
 *
 * Pointer handling depends on the mode: in Draw it takes every press (and stops
 * touch scrolling); in Select only the strokes catch presses, so text can still
 * be selected around them; otherwise it's inert.
 */
export function AnnotationOverlay({ pageNumber, size, scale, rotation }: AnnotationOverlayProps) {
  const layer = useAnnotationsLayer();
  const groupRef = useRef<SVGGElement>(null);
  const isDrawing = layer.mode === "draw";

  const strokes = useMemo(
    () => layer.annotations.filter((annotation) => annotation.pageNumber === pageNumber),
    [layer.annotations, pageNumber],
  );
  const page = useMemo(() => pageTransform(size, rotation), [size, rotation]);

  const { add, style } = layer;
  const onFinish = useCallback((points: PagePoint[]) => add({ pageNumber, points, ...style }), [add, pageNumber, style]);
  const drawing = useStrokeDrawing({ groupRef, size, enabled: isDrawing, onFinish });
  const transform = useStrokeTransform({ groupRef, size, onSelect: layer.select, onCommit: layer.update });
  // While moving or resizing, the stroke is shown (and boxed) as it would be if released now.
  const { preview } = transform;
  const shown = useMemo(
    () => (preview ? strokes.map((stroke) => (stroke.id === preview.id ? preview : stroke)) : strokes),
    [strokes, preview],
  );
  const selected = shown.find((stroke) => stroke.id === layer.selectedId);

  return (
    <svg
      viewBox={page.viewBox}
      preserveAspectRatio="none"
      className={cn(
        "absolute inset-0 size-full overflow-visible",
        isDrawing ? "cursor-crosshair touch-none" : "pointer-events-none",
      )}
      onPointerDown={isDrawing ? drawing.onPointerDown : undefined}
      onPointerMove={isDrawing ? drawing.onPointerMove : undefined}
      onPointerUp={isDrawing ? drawing.onPointerUp : undefined}
      onPointerCancel={isDrawing ? drawing.onPointerCancel : undefined}
    >
      <g ref={groupRef} transform={page.transform || undefined}>
        {shown.map((stroke) => (
          <InkPath key={stroke.id} stroke={stroke} interactive={layer.mode === "select"} transform={transform} />
        ))}
        {selected && <SelectionBox stroke={selected} scale={scale} rotation={rotation} transform={transform} />}
        {drawing.points && (
          <path
            d={toSvgPath(drawing.points)}
            fill="none"
            stroke={style.color}
            strokeWidth={style.thickness}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  );
}
