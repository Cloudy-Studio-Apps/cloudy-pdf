import { useState } from "react";
import { useElementWidth } from "@/shared/hooks/useElementWidth";
import { useVisibilityObserver } from "@/shared/hooks/useVisibilityObserver";
import { PageList } from "./PageList";
import { ViewerToolbar } from "./ViewerToolbar";
import { usePageNavigation } from "../hooks/usePageNavigation";
import { usePageSizes } from "../hooks/usePageSizes";
import { useScrollAnchor } from "../hooks/useScrollAnchor";
import { useViewerShortcuts } from "../hooks/useViewerShortcuts";
import { useWheelZoom } from "../hooks/useWheelZoom";
import { useZoom } from "../hooks/useZoom";
import { RENDER_MARGIN } from "../viewer.constants";
import type { ViewerCanvasProps } from "../viewer.types";

/**
 * The reading area: a scrollable list of pages and the floating toolbar.
 * It connects the viewer hooks (zoom, navigation, scroll anchoring, shortcuts, Ctrl+wheel).
 */
export function ViewerCanvas({ pdf, defaultPageSize, isActive }: ViewerCanvasProps) {
  // The scroll element is kept in state (via a callback ref) rather than a plain ref,
  // so hooks that depend on it re-run once it exists in the DOM.
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const viewportWidth = useElementWidth(scrollRoot);
  const pageSizes = usePageSizes(pdf.numPages, defaultPageSize, scrollRoot);
  // One observer for all pages, telling each when it's near the screen.
  const observe = useVisibilityObserver(scrollRoot, RENDER_MARGIN);

  // Fit-width follows page 1, not the widest page: sizes are learned while scrolling,
  // and the zoom changing because a wider page came into view would be disorienting.
  const zoom = useZoom(defaultPageSize.width, viewportWidth);
  const navigation = usePageNavigation(scrollRoot, pdf.numPages);
  const anchor = useScrollAnchor(scrollRoot, zoom.scale);
  // Several viewers can be mounted (one per tab); only the visible one reacts to zoom keys.
  useViewerShortcuts(zoom, isActive);
  useWheelZoom(scrollRoot, zoom, anchor);

  return (
    // `relative` lets the toolbar float over the pages instead of taking layout space.
    <div className="relative h-full">
      <div ref={setScrollRoot} className="h-full overflow-auto">
        <PageList
          pdf={pdf}
          pageSizes={pageSizes.sizes}
          scale={zoom.scale}
          isActive={isActive}
          observe={observe}
          onPageSize={pageSizes.reportSize}
        />
      </div>
      <ViewerToolbar zoom={zoom} navigation={navigation} />
    </div>
  );
}
