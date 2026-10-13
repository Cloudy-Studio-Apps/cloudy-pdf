import { useEffect, useState } from "react";
import { useVisibilityObserver } from "@/shared/hooks/useVisibilityObserver";
import { THUMBNAIL_RENDER_MARGIN } from "../thumbnails.constants";
import { ThumbnailItem } from "./ThumbnailItem";
import type { ThumbnailsPanelProps } from "../thumbnails.types";

/** Scrollable column of page previews; the current page is outlined and kept in view. */
export function ThumbnailsPanel({ pdf, pageSizes, rotation, currentPage, isActive, onSelect }: ThumbnailsPanelProps) {
  // Callback ref + state, so the observer is created once the element exists.
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const observe = useVisibilityObserver(root, THUMBNAIL_RENDER_MARGIN);

  // Follow the reader: as pages change, the current preview scrolls into view
  // ("nearest" does nothing if it's already visible).
  useEffect(() => {
    root?.querySelector(`[data-thumbnail="${currentPage}"]`)?.scrollIntoView({ block: "nearest" });
  }, [root, currentPage]);

  return (
    <div ref={setRoot} className="h-full overflow-y-auto">
      <ol className="flex flex-col items-center gap-3 py-3">
        {pageSizes.map((size, index) => (
          <ThumbnailItem
            key={index + 1}
            pdf={pdf}
            pageNumber={index + 1}
            size={size}
            rotation={rotation}
            isCurrent={currentPage === index + 1}
            isActive={isActive}
            observe={observe}
            onSelect={onSelect}
          />
        ))}
      </ol>
    </div>
  );
}
