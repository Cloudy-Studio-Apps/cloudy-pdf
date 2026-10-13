import { useEffect } from "react";
import { isRenderCancelled, releasePage, renderPage } from "../services/pdf.service";
import type { PageRenderOptions } from "../pdf.types";

/**
 * Draws a page onto its canvas while `enabled` is true, plus its fillable form
 * fields when given `formLayerRef`. Used by the viewer pages and the thumbnails.
 *
 * If the zoom or rotation changes, or the page scrolls away mid-render, the
 * effect cleanup cancels the running render, so stale renders never waste CPU
 * or draw an old state over a newer one.
 */
export function usePdfPageRender({
  canvasRef,
  pdf,
  pageNumber,
  scale,
  rotation,
  enabled,
  formLayerRef,
  onPageSize,
}: PageRenderOptions): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    const formLayer = formLayerRef?.current;
    const job = renderPage({
      pdf,
      pageNumber,
      canvas,
      scale,
      rotation,
      formLayer,
      onPageSize: onPageSize && ((size) => onPageSize(pageNumber, size)),
    });
    job.promise.catch((error) => {
      // A cancelled render is expected, not a failure; only log real errors.
      if (!isRenderCancelled(error)) console.error(`Failed to render page ${pageNumber}`, error);
    });
    return () => {
      job.cancel();
      // The inputs are rebuilt at the new zoom; their values are kept by pdf.js.
      formLayer?.replaceChildren();
    };
  }, [canvasRef, formLayerRef, pdf, pageNumber, scale, rotation, enabled, onPageSize]);

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
