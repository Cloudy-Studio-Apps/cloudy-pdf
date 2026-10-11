import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import type { LongPressHandlers, LongPressOptions, Point } from "./hooks.types";

const DEFAULT_DELAY = 500;
const DEFAULT_TOLERANCE = 10;
const HAPTIC_MS = 10;

/**
 * Press-and-hold for touch screens (phones, tablets): the touch equivalent of a
 * right-click. Calls `onLongPress` with the touch position after `delay` ms.
 *
 * - Touch and pen only: mouse users already have right-click.
 * - Moving the finger more than `tolerance` px cancels it, so scrolling a list
 *   never opens a menu by accident.
 * - The click that follows a long press is swallowed, so releasing the finger
 *   doesn't also "tap" the item (e.g. open the file).
 */
export function useLongPress(
  onLongPress: (point: Point) => void,
  { delay = DEFAULT_DELAY, tolerance = DEFAULT_TOLERANCE }: LongPressOptions = {},
): LongPressHandlers {
  const timer = useRef<number | null>(null);
  const start = useRef<Point | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  // Never leave a pending timer behind if the element unmounts mid-press.
  useEffect(() => cancel, [cancel]);

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      fired.current = false;
      const point = { x: event.clientX, y: event.clientY };
      start.current = point;
      timer.current = window.setTimeout(() => {
        fired.current = true;
        // Short vibration as feedback where supported (Android); a no-op elsewhere.
        navigator.vibrate?.(HAPTIC_MS);
        onLongPress(point);
        cancel();
      }, delay);
    },
    [onLongPress, delay, cancel],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!start.current) return;
      const moved = Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y);
      if (moved > tolerance) cancel();
    },
    [tolerance, cancel],
  );

  // Capture phase: runs before the inner button's onClick, so it can stop it.
  const onClickCapture = useCallback((event: MouseEvent) => {
    if (!fired.current) return;
    fired.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onClickCapture,
  };
}
