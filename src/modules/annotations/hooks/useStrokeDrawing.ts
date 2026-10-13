import { useCallback, useRef, useState, type PointerEvent } from "react";
import { clampToPage, toPagePoint } from "../annotations.utils";
import { extendStroke, finishStroke, startStroke } from "../ink.utils";
import type { StrokeDraft, StrokeDrawing, StrokeSample, UseStrokeDrawingOptions } from "../annotations.types";

/**
 * Freehand drawing on a page overlay: press, drag, release = one stroke.
 * Pointer positions are converted to page space as they arrive (so the stroke is
 * right at any zoom or rotation) and fed through the pen's rules in ink.utils.
 */
export function useStrokeDrawing({
  groupRef,
  size,
  enabled,
  pen,
  thickness,
  onFinish,
}: UseStrokeDrawingOptions): StrokeDrawing {
  const [draft, setDraft] = useState<StrokeDraft | null>(null);
  // The handlers read the stroke from a ref: several moves can arrive before a re-render.
  const draftRef = useRef<StrokeDraft | null>(null);

  const sampleOf = useCallback(
    (event: globalThis.PointerEvent): StrokeSample | null => {
      const group = groupRef.current;
      const point = group && toPagePoint(group, event.clientX, event.clientY);
      if (!point) return null;
      return {
        point: clampToPage(point, size),
        time: event.timeStamp,
        // Mice report a fixed 0.5 and fingers are unreliable: only a stylus gives real pressure.
        pressure: event.pointerType === "pen" ? event.pressure : null,
      };
    },
    [groupRef, size],
  );

  const update = (next: StrokeDraft | null) => {
    draftRef.current = next;
    setDraft(next);
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!enabled || event.button !== 0) return;
    const sample = sampleOf(event.nativeEvent);
    if (!sample) return;
    // No text selection, no scrolling: this press is for the pen.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    update(startStroke(sample, pen, thickness));
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const current = draftRef.current;
    if (!current) return;
    // Coalesced events: the positions the browser merged into this one move,
    // so fast strokes stay smooth instead of turning into straight segments.
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [];
    let next = current;
    for (const sample of (events.length > 0 ? events : [event.nativeEvent]).map(sampleOf)) {
      if (sample) next = extendStroke(next, sample, pen, thickness);
    }
    if (next !== current) update(next);
  };

  const finish = (keep: boolean) => {
    const current = draftRef.current;
    update(null);
    const stroke = keep && current && finishStroke(current, pen);
    if (stroke) onFinish(stroke);
  };

  return {
    draft,
    onPointerDown,
    onPointerMove,
    onPointerUp: () => finish(true),
    // Cancelled by the system (e.g. a gesture took over): drop the stroke.
    onPointerCancel: () => finish(false),
  };
}
