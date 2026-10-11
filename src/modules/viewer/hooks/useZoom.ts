import { useCallback, useMemo, useRef, useState } from "react";
import { clamp } from "@/shared/utils/math.utils";
import { MAX_ZOOM, MIN_ZOOM, PAGE_GUTTER, ZOOM_STEPS } from "../viewer.constants";
import type { ZoomControl, ZoomState } from "../viewer.types";

// The next zoom step above / below the current scale. The 0.001 tolerance avoids
// floating-point issues (e.g. 1.2500000001 not counting as 1.25).
// Fit-width produces arbitrary scales like 1.37, so zooming in from there goes to 1.5.
const nextStep = (scale: number) => ZOOM_STEPS.find((step) => step > scale + 0.001) ?? MAX_ZOOM;
const previousStep = (scale: number) =>
  [...ZOOM_STEPS].reverse().find((step) => step < scale - 0.001) ?? MIN_ZOOM;

/**
 * Zoom state for the viewer.
 * @param pageWidth width of the page to fit at 100%, in px
 * @param viewportWidth current width of the scroll area, in px
 */
export function useZoom(pageWidth: number, viewportWidth: number): ZoomControl {
  // Starts in fit-width, the most comfortable default for reading.
  const [state, setState] = useState<ZoomState>({ mode: "fit-width", scale: 1 });

  // In fit-width mode the scale is derived, not stored: it's recomputed
  // whenever the window resizes, so pages always fill the width.
  const scale = useMemo(() => {
    if (state.mode === "custom" || !pageWidth || !viewportWidth) return state.scale;
    return clamp((viewportWidth - PAGE_GUTTER * 2) / pageWidth, MIN_ZOOM, MAX_ZOOM);
  }, [state, pageWidth, viewportWidth]);

  // Any manual zoom leaves fit-width mode and freezes the chosen scale.
  // Updates are functional so fast repeats (several Ctrl+wheel notches before React
  // re-renders) each move one step instead of all reading the same stale scale.
  // Only the first step out of fit-width uses the derived `scale`; after that the
  // mode is "custom" and the stored scale is the source of truth.
  // The fit-width scale is read from a ref, so these callbacks stay stable while the
  // window resizes; otherwise every resize would re-render whatever receives them.
  const fitScale = useRef(scale);
  fitScale.current = scale;
  const step = useCallback(
    (pick: (scale: number) => number) =>
      setState((current) => ({
        mode: "custom",
        scale: pick(current.mode === "custom" ? current.scale : fitScale.current),
      })),
    [],
  );
  const zoomIn = useCallback(() => step(nextStep), [step]);
  const zoomOut = useCallback(() => step(previousStep), [step]);
  const fitWidth = useCallback(() => setState((current) => ({ ...current, mode: "fit-width" })), []);

  return {
    scale,
    mode: state.mode,
    canZoomIn: scale < MAX_ZOOM,
    canZoomOut: scale > MIN_ZOOM,
    zoomIn,
    zoomOut,
    fitWidth,
  };
}
