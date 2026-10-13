import { memo, useRef } from "react";
import { usePdfPageRender } from "@/modules/pdf/hooks/usePdfPageRender";
import { rotateSize } from "@/modules/pdf/pdf.utils";
import { useIsVisible } from "@/shared/hooks/useIsVisible";
import { cn } from "@/shared/utils/class-names.utils";
import { THUMBNAIL_WIDTH } from "../thumbnails.constants";
import type { ThumbnailItemProps } from "../thumbnails.types";

/**
 * One page preview and its number. Drawn only while near the panel's visible
 * area (same lazy rendering as the viewer pages). memo: the list re-renders on
 * every page change, but only the old and new current items actually change.
 */
export const ThumbnailItem = memo(function ThumbnailItem({
  pdf,
  pageNumber,
  size,
  rotation,
  isCurrent,
  isActive,
  observe,
  onSelect,
}: ThumbnailItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shown = useIsVisible(itemRef, observe) && isActive;

  const displayed = rotateSize(size, rotation);
  const scale = THUMBNAIL_WIDTH / displayed.width;
  const width = THUMBNAIL_WIDTH;
  const height = displayed.height * scale;
  usePdfPageRender({ canvasRef, pdf, pageNumber, scale, rotation, enabled: shown });

  return (
    // data-thumbnail: lets the panel scroll the current page's preview into view.
    <li ref={itemRef} data-thumbnail={pageNumber}>
      <button
        type="button"
        aria-label={`Page ${pageNumber}`}
        aria-current={isCurrent ? "page" : undefined}
        onClick={() => onSelect(pageNumber)}
        className="group flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          className={cn(
            "block bg-white ring-1 ring-border transition-shadow group-hover:ring-muted",
            isCurrent && "ring-2 ring-accent group-hover:ring-accent",
          )}
          style={{ width, height }}
        >
          {shown && <canvas ref={canvasRef} className="block" style={{ width, height }} />}
        </span>
        <span className={cn("text-xs tabular-nums text-muted", isCurrent && "font-medium text-accent")}>
          {pageNumber}
        </span>
      </button>
    </li>
  );
});
