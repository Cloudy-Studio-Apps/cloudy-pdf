import { memo, useRef, type CSSProperties } from "react";
import { usePdfPageRender } from "@/modules/pdf/hooks/usePdfPageRender";
import { usePdfTextLayer } from "@/modules/pdf/hooks/usePdfTextLayer";
import { rotateSize } from "@/modules/pdf/pdf.utils";
import { useIsVisible } from "@/shared/hooks/useIsVisible";
import { useTextHighlights } from "../hooks/useTextHighlights";
import type { PdfPageProps } from "../viewer.types";

/**
 * One PDF page: the canvas, the invisible selectable text over it, and the
 * fillable form fields over both. The outer
 * box always has the page's size (so scrolling and page positions are correct),
 * but canvas and text only exist while the page is near the screen and its tab is
 * the active one. Other pages are empty white boxes, which keeps memory flat on
 * big documents and with many tabs open.
 *
 * memo: skip re-rendering every page when only the toolbar state changes (e.g. current page).
 */
export const PdfPage = memo(function PdfPage({
  pdf,
  pageNumber,
  size,
  scale,
  rotation,
  isActive,
  observe,
  highlights,
  onPageSize,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const formLayerRef = useRef<HTMLDivElement>(null);
  const shown = useIsVisible(containerRef, observe) && isActive;

  usePdfPageRender({ canvasRef, formLayerRef, pdf, pageNumber, scale, rotation, enabled: shown, onPageSize });
  const textLayer = usePdfTextLayer({ containerRef: textLayerRef, pdf, pageNumber, scale, rotation, enabled: shown });
  useTextHighlights(textLayer, highlights);

  // Display size in CSS pixels (the canvas inside may have more physical pixels on HiDPI).
  const displayed = rotateSize(size, rotation);
  const width = displayed.width * scale;
  const height = displayed.height * scale;

  return (
    <div
      ref={containerRef}
      // Used by usePageNavigation to find pages and detect the current one.
      data-page-number={pageNumber}
      aria-label={`Page ${pageNumber}`}
      className="relative shrink-0 bg-white shadow-sm ring-1 ring-ink/5"
      style={{ width, height }}
    >
      {shown && (
        <>
          <canvas ref={canvasRef} className="block" style={{ width, height }} />
          {/* pdf.js sizes fonts from this variable; it must equal the canvas scale. */}
          <div
            ref={textLayerRef}
            className="textLayer"
            style={{ "--total-scale-factor": scale } as CSSProperties}
          />
          {/* `contents`: no box of its own; pdf.js's layer inside is positioned over the page. Last, so it's on top. */}
          <div ref={formLayerRef} className="contents" style={{ "--total-scale-factor": scale } as CSSProperties} />
        </>
      )}
    </div>
  );
});
