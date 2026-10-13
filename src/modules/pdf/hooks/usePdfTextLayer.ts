import { useEffect, useState } from "react";
import { isRenderCancelled, renderTextLayer } from "../services/pdf.service";
import type { TextLayerHandle, TextLayerHookOptions } from "../pdf.types";

/**
 * Builds a page's selectable text layer while `enabled`, rebuilt on zoom or
 * rotation. Returns the rendered layer (for search highlights), or null.
 */
export function usePdfTextLayer({
  containerRef,
  pdf,
  pageNumber,
  scale,
  rotation,
  enabled,
}: TextLayerHookOptions): TextLayerHandle | null {
  const [layer, setLayer] = useState<TextLayerHandle | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const job = renderTextLayer({ pdf, pageNumber, container, scale, rotation });
    job.promise.then(setLayer).catch((error) => {
      if (!isRenderCancelled(error)) console.error(`Failed to build text layer of page ${pageNumber}`, error);
    });
    return () => {
      job.cancel();
      container.replaceChildren();
      setLayer(null);
    };
  }, [containerRef, pdf, pageNumber, scale, rotation, enabled]);

  return layer;
}
