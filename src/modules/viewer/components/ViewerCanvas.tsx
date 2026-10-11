import { useState } from "react";
import { useElementWidth } from "@/shared/hooks/useElementWidth";
import { PageList } from "./PageList";
import { ViewerToolbar } from "./ViewerToolbar";
import { usePageNavigation } from "../hooks/usePageNavigation";
import { useScrollAnchor } from "../hooks/useScrollAnchor";
import { useViewerShortcuts } from "../hooks/useViewerShortcuts";
import { useZoom } from "../hooks/useZoom";
import type { ViewerCanvasProps } from "../viewer.types";

export function ViewerCanvas({ pdf, pageSizes }: ViewerCanvasProps) {
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const viewportWidth = useElementWidth(scrollRoot);
  const widestPage = Math.max(...pageSizes.map((size) => size.width));

  const zoom = useZoom(widestPage, viewportWidth);
  const navigation = usePageNavigation(scrollRoot, pageSizes.length);
  useScrollAnchor(scrollRoot, zoom.scale);
  useViewerShortcuts(zoom);

  return (
    <div className="relative h-full">
      <div ref={setScrollRoot} className="h-full overflow-auto">
        <PageList pdf={pdf} pageSizes={pageSizes} scale={zoom.scale} scrollRoot={scrollRoot} />
      </div>
      <ViewerToolbar zoom={zoom} navigation={navigation} />
    </div>
  );
}
