import { useCallback, useRef, useState, type PointerEvent } from "react";
import { moveStroke, resizeStroke, toPagePoint } from "../annotations.utils";
import type {
  Corner,
  InkAnnotation,
  PointerHandlers,
  StrokeTransform,
  TransformStart,
  UseStrokeTransformOptions,
} from "../annotations.types";

/**
 * Moving and resizing a stroke with the pointer. Pressing a stroke selects it;
 * dragging it moves it, dragging a corner handle scales it. Both stay on the page.
 * While dragging only a preview changes; the result is committed once, on release,
 * so each move or resize is a single undo step.
 */
export function useStrokeTransform({ groupRef, size, onSelect, onCommit }: UseStrokeTransformOptions): StrokeTransform {
  const [preview, setPreview] = useState<InkAnnotation | null>(null);
  const startRef = useRef<TransformStart | null>(null);
  // The handlers read the latest preview from a ref: release can come before a re-render.
  const previewRef = useRef<InkAnnotation | null>(null);

  const pointAt = useCallback(
    (event: PointerEvent<SVGElement>) => {
      const group = groupRef.current;
      return group && toPagePoint(group, event.clientX, event.clientY);
    },
    [groupRef],
  );

  const finish = useCallback(
    (commit: boolean) => {
      const result = previewRef.current;
      startRef.current = null;
      previewRef.current = null;
      setPreview(null);
      if (commit && result) onCommit(result);
    },
    [onCommit],
  );

  const bind = useCallback(
    (stroke: InkAnnotation, corner: Corner | null): PointerHandlers => ({
      onPointerDown: (event) => {
        if (event.button !== 0) return;
        const origin = pointAt(event);
        if (!origin) return;
        event.preventDefault();
        // A handle sits on top of the box: don't let the box start a move too.
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        onSelect(stroke.id);
        startRef.current = { stroke, origin, corner };
      },
      onPointerMove: (event) => {
        const start = startRef.current;
        const point = start && pointAt(event);
        if (!start || !point) return;
        previewRef.current = start.corner
          ? resizeStroke(start.stroke, start.corner, start.origin, point, size)
          : moveStroke(start.stroke, point.x - start.origin.x, point.y - start.origin.y, size);
        setPreview(previewRef.current);
      },
      onPointerUp: () => finish(true),
      onPointerCancel: () => finish(false),
    }),
    [pointAt, onSelect, size, finish],
  );

  const bindMove = useCallback((stroke: InkAnnotation) => bind(stroke, null), [bind]);
  const bindResize = useCallback((stroke: InkAnnotation, corner: Corner) => bind(stroke, corner), [bind]);

  return { preview, bindMove, bindResize };
}
