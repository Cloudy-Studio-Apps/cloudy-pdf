import { useState } from "react";
import { useElementWidth } from "@/shared/hooks/useElementWidth";
import { PageList } from "./PageList";
import { ViewerToolbar } from "./ViewerToolbar";
import { usePageNavigation } from "../hooks/usePageNavigation";
import { useScrollAnchor } from "../hooks/useScrollAnchor";
import { useViewerShortcuts } from "../hooks/useViewerShortcuts";
import { useZoom } from "../hooks/useZoom";
import type { ViewerCanvasProps } from "../viewer.types";

/**
 * The reading area: a scrollable list of pages and the floating toolbar.
 * It connects the viewer hooks (zoom, navigation, scroll anchoring, shortcuts).
 */
export function ViewerCanvas({ pdf, pageSizes, isActive }: ViewerCanvasProps) {
  // The scroll element is kept in state (via a callback ref) rather than a plain ref,
  // so hooks that depend on it re-run once it exists in the DOM.
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const viewportWidth = useElementWidth(scrollRoot);
  // Fit the widest page, so mixed-size documents never overflow horizontally in fit-width.
  const widestPage = Math.max(...pageSizes.map((size) => size.width));

  const zoom = useZoom(widestPage, viewportWidth);
  const navigation = usePageNavigation(scrollRoot, pageSizes.length);
  useScrollAnchor(scrollRoot, zoom.scale);
  // Several viewers can be mounted (one per tab); only the visible one reacts to zoom keys.
  useViewerShortcuts(zoom, isActive);

  return (
    // `relative` lets the toolbar float over the pages instead of taking layout space.
    <div className="relative h-full">
      <div ref={setScrollRoot} className="h-full overflow-auto">
        <PageList pdf={pdf} pageSizes={pageSizes} scale={zoom.scale} scrollRoot={scrollRoot} />
      </div>
      <ViewerToolbar zoom={zoom} navigation={navigation} />
    </div>
  );
}
