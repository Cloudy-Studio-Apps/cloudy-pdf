import { useCallback, useMemo, useState } from "react";
import { clamp } from "@/shared/utils/math.utils";
import { MAX_ZOOM, MIN_ZOOM, PAGE_GUTTER, ZOOM_STEPS } from "../viewer.constants";
import type { ZoomControl, ZoomState } from "../viewer.types";

const nextStep = (scale: number) => ZOOM_STEPS.find((step) => step > scale + 0.001) ?? MAX_ZOOM;
const previousStep = (scale: number) =>
  [...ZOOM_STEPS].reverse().find((step) => step < scale - 0.001) ?? MIN_ZOOM;

export function useZoom(pageWidth: number, viewportWidth: number): ZoomControl {
  const [state, setState] = useState<ZoomState>({ mode: "fit-width", scale: 1 });

  const scale = useMemo(() => {
    if (state.mode === "custom" || !pageWidth || !viewportWidth) return state.scale;
    return clamp((viewportWidth - PAGE_GUTTER * 2) / pageWidth, MIN_ZOOM, MAX_ZOOM);
  }, [state, pageWidth, viewportWidth]);

  const zoomIn = useCallback(() => setState({ mode: "custom", scale: nextStep(scale) }), [scale]);
  const zoomOut = useCallback(() => setState({ mode: "custom", scale: previousStep(scale) }), [scale]);
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
