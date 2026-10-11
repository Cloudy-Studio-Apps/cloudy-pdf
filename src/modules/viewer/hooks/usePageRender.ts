import { useEffect } from "react";
import { isRenderCancelled, renderPage } from "@/modules/pdf/services/pdf.service";
import type { PageRenderOptions } from "../viewer.types";

/**
 * Draws a page onto its canvas while `enabled` is true.
 *
 * If the zoom changes or the page scrolls away mid-render, the effect cleanup
 * cancels the running render. That stops stale renders from wasting CPU or
 * drawing an old zoom level over a newer one.
 */
export function usePageRender({ canvasRef, pdf, pageNumber, scale, enabled }: PageRenderOptions): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    const job = renderPage({ pdf, pageNumber, canvas, scale });
    job.promise.catch((error) => {
      // A cancelled render is expected, not a failure; only log real errors.
      if (!isRenderCancelled(error)) console.error(`Failed to render page ${pageNumber}`, error);
    });
    return job.cancel;
  }, [canvasRef, pdf, pageNumber, scale, enabled]);
}
