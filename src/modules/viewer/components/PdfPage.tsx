import { memo, useRef } from "react";
import { useInView } from "@/shared/hooks/useInView";
import { usePageRender } from "../hooks/usePageRender";
import { RENDER_MARGIN } from "../viewer.constants";
import type { PdfPageProps } from "../viewer.types";

/**
 * One PDF page. The outer box always has the page's exact size (so scrolling and
 * page positions are correct), but the canvas only exists while the page is near
 * the screen. Off-screen pages are empty white boxes, which keeps memory low on
 * big documents.
 *
 * memo: skip re-rendering every page when only the toolbar state changes (e.g. current page).
 */
export const PdfPage = memo(function PdfPage({ pdf, pageNumber, size, scale, scrollRoot }: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(containerRef, { root: scrollRoot, rootMargin: RENDER_MARGIN });

  usePageRender({ canvasRef, pdf, pageNumber, scale, enabled: inView });

  // Display size in CSS pixels (the canvas inside may have more physical pixels on HiDPI).
  const width = size.width * scale;
  const height = size.height * scale;

  return (
    <div
      ref={containerRef}
      // Used by usePageNavigation to find pages and detect the current one.
      data-page-number={pageNumber}
      aria-label={`Page ${pageNumber}`}
      className="relative shrink-0 bg-white shadow-sm ring-1 ring-ink/5"
      style={{ width, height }}
    >
      {inView && <canvas ref={canvasRef} className="block" style={{ width, height }} />}
    </div>
  );
});
