import { memo, useRef } from "react";
import { useInView } from "@/shared/hooks/useInView";
import { usePageRender } from "../hooks/usePageRender";
import { RENDER_MARGIN } from "../viewer.constants";
import type { PdfPageProps } from "../viewer.types";

export const PdfPage = memo(function PdfPage({ pdf, pageNumber, size, scale, scrollRoot }: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(containerRef, { root: scrollRoot, rootMargin: RENDER_MARGIN });

  usePageRender({ canvasRef, pdf, pageNumber, scale, enabled: inView });

  const width = size.width * scale;
  const height = size.height * scale;

  return (
    <div
      ref={containerRef}
      data-page-number={pageNumber}
      aria-label={`Page ${pageNumber}`}
      className="relative shrink-0 bg-white shadow-sm ring-1 ring-ink/5"
      style={{ width, height }}
    >
      {inView && <canvas ref={canvasRef} className="block" style={{ width, height }} />}
    </div>
  );
});
