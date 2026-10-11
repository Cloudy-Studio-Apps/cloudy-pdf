import { useEffect, useRef } from "react";
import { WHEEL_ZOOM_STEP } from "../viewer.constants";
import { wheelDeltaInPixels } from "../viewer.utils";
import type { ScrollAnchor, ZoomControl } from "../viewer.types";

/**
 * Ctrl + mouse wheel zooms, like Adobe Acrobat: wheel up zooms in, wheel down zooms
 * out, one zoom step per notch, and the spot under the pointer stays under it.
 * Touchpad pinch also lands here, since browsers report it as a Ctrl+wheel.
 *
 * No `isActive` gate needed: the listener is on the scroll area itself, and
 * background tabs are `inert`, so they never receive wheel events.
 */
export function useWheelZoom(
  container: HTMLElement | null,
  zoom: ZoomControl,
  anchor: ScrollAnchor,
): void {
  // The listener is attached once per container; it reads the latest zoom from
  // this ref so it never acts on a stale scale or stale canZoomIn/canZoomOut.
  const latest = useRef({ zoom, anchor });
  latest.current = { zoom, anchor };

  useEffect(() => {
    if (!container) return;
    // Touchpads send many small deltas; this sums them until a full step is reached.
    let accumulated = 0;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return; // plain wheel keeps scrolling
      // Stop the webview from zooming the whole UI instead of the document.
      event.preventDefault();

      const delta = wheelDeltaInPixels(event, container.clientHeight);
      // Changing direction starts over, so a reversal reacts immediately.
      if (Math.sign(delta) !== Math.sign(accumulated)) accumulated = 0;
      accumulated += delta;
      if (Math.abs(accumulated) < WHEEL_ZOOM_STEP) return;

      // At most one step per event: big notches (some mice report 100–120px) still
      // move a single step, which matches Acrobat.
      const zoomingIn = accumulated < 0; // wheel up = negative deltaY
      accumulated = 0;

      const { zoom, anchor } = latest.current;
      if (zoomingIn ? !zoom.canZoomIn : !zoom.canZoomOut) return;

      // Anchor on the pointer, relative to the scroll area's visible top-left.
      const bounds = container.getBoundingClientRect();
      anchor.setAnchor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      if (zoomingIn) zoom.zoomIn();
      else zoom.zoomOut();
    };

    // passive: false is required to call preventDefault (React's onWheel is passive).
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [container]);
}
