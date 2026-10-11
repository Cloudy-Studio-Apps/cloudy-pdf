import { useEffect } from "react";
import { isRenderCancelled, releasePage, renderPage } from "@/modules/pdf/services/pdf.service";
import type { PageRenderOptions } from "../viewer.types";

/**
 * Draws a page onto its canvas while `enabled` is true.
 *
 * If the zoom changes or the page scrolls away mid-render, the effect cleanup
 * cancels the running render. That stops stale renders from wasting CPU or
 * drawing an old zoom level over a newer one.
 */
export function usePageRender({
  canvasRef,
  pdf,
  pageNumber,
  scale,
  enabled,
  onPageSize,
}: PageRenderOptions): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    const job = renderPage({ pdf, pageNumber, canvas, scale, onPageSize: (size) => onPageSize(pageNumber, size) });
    job.promise.catch((error) => {
      // A cancelled render is expected, not a failure; only log real errors.
      if (!isRenderCancelled(error)) console.error(`Failed to render page ${pageNumber}`, error);
    });
    return job.cancel;
  }, [canvasRef, pdf, pageNumber, scale, enabled, onPageSize]);

  // Separate from the render effect so zooming (which re-renders) doesn't free
  // anything; this cleanup only runs when the page stops being shown.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    return () => {
      // A full-page HiDPI canvas can hold 20–30 MB. WebKit keeps that bitmap until
      // garbage collection even after the element is removed; a zero size frees it now.
      canvas.width = 0;
      canvas.height = 0;
      releasePage(pdf, pageNumber);
    };
  }, [canvasRef, pdf, pageNumber, enabled]);
}
