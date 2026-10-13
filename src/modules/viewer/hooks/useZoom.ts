import { useCallback, useMemo, useRef, useState } from "react";
import type { PageSize } from "@/modules/pdf/pdf.types";
import type { ElementSize } from "@/shared/hooks/hooks.types";
import { clamp } from "@/shared/utils/math.utils";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEPS } from "../viewer.constants";
import { computeFitScale } from "../viewer.utils";
import type { ZoomControl, ZoomState } from "../viewer.types";

// The next zoom step above / below the current scale. The 0.001 tolerance avoids
// floating-point issues (e.g. 1.2500000001 not counting as 1.25).
// Fit modes produce arbitrary scales like 1.37, so zooming in from there goes to 1.5.
const nextStep = (scale: number) => ZOOM_STEPS.find((step) => step > scale + 0.001) ?? MAX_ZOOM;
const previousStep = (scale: number) =>
  [...ZOOM_STEPS].reverse().find((step) => step < scale - 0.001) ?? MIN_ZOOM;

/**
 * Zoom state for the viewer.
 * @param page size of the page the fit modes fit (page 1, rotated for display), at 100%
 * @param viewport current size of the scroll area, in px
 */
export function useZoom(page: PageSize, viewport: ElementSize): ZoomControl {
  // Starts in fit-width, the most comfortable default for reading.
  const [state, setState] = useState<ZoomState>({ mode: "fit-width", scale: 1 });

  // In fit modes the scale is derived, not stored: it's recomputed whenever the
  // window resizes, so pages keep filling the space.
  const scale = useMemo(() => {
    if (state.mode === "custom") return state.scale;
    const fit = computeFitScale(state.mode, page, viewport);
    return fit === null ? state.scale : clamp(fit, MIN_ZOOM, MAX_ZOOM);
  }, [state, page, viewport]);

  // Any manual zoom leaves the fit modes and freezes the chosen scale.
  // Updates are functional so fast repeats (several Ctrl+wheel notches before React
  // re-renders) each move one step instead of all reading the same stale scale.
  // The derived scale is read from a ref, so these callbacks stay stable while the
  // window resizes; otherwise every resize would re-render whatever receives them.
  const derivedScale = useRef(scale);
  derivedScale.current = scale;
  const step = useCallback(
    (pick: (scale: number) => number) =>
      setState((current) => ({
        mode: "custom",
        scale: pick(current.mode === "custom" ? current.scale : derivedScale.current),
      })),
    [],
  );
  const zoomIn = useCallback(() => step(nextStep), [step]);
  const zoomOut = useCallback(() => step(previousStep), [step]);
  const setScale = useCallback(
    (value: number) => setState({ mode: "custom", scale: clamp(value, MIN_ZOOM, MAX_ZOOM) }),
    [],
  );
  const fitWidth = useCallback(() => setState((current) => ({ ...current, mode: "fit-width" })), []);
  const fitPage = useCallback(() => setState((current) => ({ ...current, mode: "fit-page" })), []);

  return {
    scale,
    mode: state.mode,
    canZoomIn: scale < MAX_ZOOM,
    canZoomOut: scale > MIN_ZOOM,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
    setScale,
  };
}
