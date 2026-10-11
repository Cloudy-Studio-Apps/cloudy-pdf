import { useEffect } from "react";
import { isRenderCancelled, renderPage } from "@/modules/pdf/services/pdf.service";
import type { PageRenderOptions } from "../viewer.types";

export function usePageRender({ canvasRef, pdf, pageNumber, scale, enabled }: PageRenderOptions): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    const job = renderPage({ pdf, pageNumber, canvas, scale });
    job.promise.catch((error) => {
      if (!isRenderCancelled(error)) console.error(`Failed to render page ${pageNumber}`, error);
    });
    return job.cancel;
  }, [canvasRef, pdf, pageNumber, scale, enabled]);
}
