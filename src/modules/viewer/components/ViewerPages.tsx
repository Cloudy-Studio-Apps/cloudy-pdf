import { cn } from "@/shared/utils/class-names.utils";
import { PageList } from "./PageList";
import { ViewerToolbar } from "./ViewerToolbar";
import type { ViewerPagesProps } from "../viewer.types";

/**
 * The reading area: the scrollable pages and the floating page/zoom pill.
 * All state comes from useViewerState; search highlights come from the app.
 */
export function ViewerPages({ viewer, highlights, pageOverlay }: ViewerPagesProps) {
  const { zoom, navigation, rotation, display, tool, isPanning } = viewer;
  const isHand = tool === "hand";

  return (
    // `relative` lets the toolbar float over the pages, and is the offsetParent page
    // positions are measured against (see usePageNavigation).
    <div className="relative h-full">
      <div
        ref={viewer.scrollRootRef}
        className={cn(
          "h-full overflow-auto",
          // Hand tool: the text can't be selected, so drags reach the scroll area.
          isHand && "[&_.textLayer]:pointer-events-none",
          isHand && (isPanning ? "cursor-grabbing" : "cursor-grab"),
        )}
      >
        <PageList
          pdf={viewer.pdf}
          pageSizes={viewer.pageSizes.sizes}
          scale={zoom.scale}
          rotation={rotation.rotation}
          singlePage={display === "single" ? navigation.currentPage : null}
          isActive={viewer.isActive}
          observe={viewer.observe}
          highlights={highlights}
          onPageSize={viewer.pageSizes.reportSize}
          pageOverlay={pageOverlay}
        />
      </div>
      <ViewerToolbar zoom={zoom} navigation={navigation} />
    </div>
  );
}
