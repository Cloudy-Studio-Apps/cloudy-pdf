import { memo, useRef } from "react";
import { useIsVisible } from "@/shared/hooks/useIsVisible";
import { usePageRender } from "../hooks/usePageRender";
import type { PdfPageProps } from "../viewer.types";

/**
 * One PDF page. The outer box always has the page's size (so scrolling and
 * page positions are correct), but the canvas only exists while the page is near
 * the screen and its tab is the active one. Other pages are empty white boxes,
 * which keeps memory flat on big documents and with many tabs open.
 *
 * memo: skip re-rendering every page when only the toolbar state changes (e.g. current page).
 */
export const PdfPage = memo(function PdfPage({
  pdf,
  pageNumber,
  size,
  scale,
  isActive,
  observe,
  onPageSize,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shown = useIsVisible(containerRef, observe) && isActive;

  usePageRender({ canvasRef, pdf, pageNumber, scale, enabled: shown, onPageSize });

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
      {shown && <canvas ref={canvasRef} className="block" style={{ width, height }} />}
    </div>
  );
});
