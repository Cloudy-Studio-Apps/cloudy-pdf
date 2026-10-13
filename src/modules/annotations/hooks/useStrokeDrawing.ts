import { useCallback, useRef, useState, type PointerEvent } from "react";
import { MIN_POINT_DISTANCE } from "../annotations.constants";
import { clampToPage, distance, toPagePoint } from "../annotations.utils";
import type { PagePoint, StrokeDrawing, UseStrokeDrawingOptions } from "../annotations.types";

/**
 * Freehand drawing on a page overlay: press, drag, release = one stroke.
 * Points are converted to page space as they arrive, so the stroke is right at
 * any zoom or rotation. A press without movement (fewer than 2 points) is dropped.
 */
export function useStrokeDrawing({ groupRef, size, enabled, onFinish }: UseStrokeDrawingOptions): StrokeDrawing {
  const [points, setPoints] = useState<PagePoint[] | null>(null);
  // The handlers read the stroke from a ref: several moves can arrive before a re-render.
  const pointsRef = useRef<PagePoint[] | null>(null);

  const pointAt = useCallback(
    (clientX: number, clientY: number) => {
      const group = groupRef.current;
      const point = group && toPagePoint(group, clientX, clientY);
      return point && clampToPage(point, size);
    },
    [groupRef, size],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      if (!enabled || event.button !== 0) return;
      const point = pointAt(event.clientX, event.clientY);
      if (!point) return;
      // No text selection, no scrolling: this press is for the pen.
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointsRef.current = [point];
      setPoints(pointsRef.current);
    },
    [enabled, pointAt],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      let current = pointsRef.current;
      if (!current) return;
      // Coalesced events: the positions the browser merged into this one move,
      // so fast strokes stay smooth instead of turning into straight segments.
      const events = event.nativeEvent.getCoalescedEvents?.() ?? [];
      for (const { clientX, clientY } of events.length > 0 ? events : [event]) {
        const point = pointAt(clientX, clientY);
        if (point && distance(point, current[current.length - 1]) >= MIN_POINT_DISTANCE) {
          current = [...current, point];
        }
      }
      if (current === pointsRef.current) return;
      pointsRef.current = current;
      setPoints(current);
    },
    [pointAt],
  );

  const finish = useCallback(
    (keep: boolean) => {
      const current = pointsRef.current;
      pointsRef.current = null;
      setPoints(null);
      if (keep && current && current.length >= 2) onFinish(current);
    },
    [onFinish],
  );

  const onPointerUp = useCallback(() => finish(true), [finish]);
  // Cancelled by the system (e.g. a gesture took over): drop the stroke.
  const onPointerCancel = useCallback(() => finish(false), [finish]);

  return { points, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
