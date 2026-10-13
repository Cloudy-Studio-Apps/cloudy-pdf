import { useEffect, useMemo, useRef, useState } from "react";
import { rotateSize } from "@/modules/pdf/pdf.utils";
import { useElementSize } from "@/shared/hooks/useElementSize";
import { useVisibilityObserver } from "@/shared/hooks/useVisibilityObserver";
import { RENDER_MARGIN } from "../viewer.constants";
import type { PageDisplay, UseViewerStateOptions, ViewerState, ViewerTool } from "../viewer.types";
import { useHandTool } from "./useHandTool";
import { usePageNavigation } from "./usePageNavigation";
import { usePageSizes } from "./usePageSizes";
import { useRotation } from "./useRotation";
import { useScrollAnchor } from "./useScrollAnchor";
import { useViewerShortcuts } from "./useViewerShortcuts";
import { useWheelZoom } from "./useWheelZoom";
import { useZoom } from "./useZoom";

/**
 * All the state of one document's view, in one place: zoom, rotation, page
 * display, tool, navigation and page sizes. The app's Workspace reads it to drive
 * the toolbar and panels; ViewerPages renders it.
 */
export function useViewerState({ pdf, defaultPageSize, isActive }: UseViewerStateOptions): ViewerState {
  // The scroll element is kept in state (via a callback ref) rather than a plain ref,
  // so hooks that depend on it re-run once it exists in the DOM.
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const viewport = useElementSize(scrollRoot);
  const rotation = useRotation();
  const [display, setDisplay] = useState<PageDisplay>("continuous");
  const [tool, setTool] = useState<ViewerTool>("select");

  const pageSizes = usePageSizes(pdf.numPages, defaultPageSize, scrollRoot);
  // Fit modes follow page 1, not the widest page: sizes are learned while scrolling,
  // and the zoom changing because a wider page came into view would be disorienting.
  const fitTarget = useMemo(() => rotateSize(defaultPageSize, rotation.rotation), [defaultPageSize, rotation.rotation]);
  const zoom = useZoom(fitTarget, viewport);
  const navigation = usePageNavigation(scrollRoot, pdf.numPages);
  const anchor = useScrollAnchor(scrollRoot, zoom.scale);
  // One observer for all pages, telling each when it's near the screen.
  const observe = useVisibilityObserver(scrollRoot, RENDER_MARGIN);
  const isPanning = useHandTool(scrollRoot, tool === "hand");
  // Several viewers can be mounted (one per tab); only the visible one reacts to keys.
  useViewerShortcuts({ zoom, navigation, display, enabled: isActive });
  useWheelZoom(scrollRoot, zoom, anchor);

  // Rotating or switching page display rebuilds the whole layout; stay on the same page.
  const currentPage = useRef(navigation.currentPage);
  currentPage.current = navigation.currentPage;
  const { goToPage } = navigation;
  const isFirstLayout = useRef(true);
  useEffect(() => {
    if (isFirstLayout.current) {
      isFirstLayout.current = false;
      return;
    }
    goToPage(currentPage.current);
  }, [rotation.rotation, display, goToPage]);

  return {
    pdf,
    isActive,
    scrollRootRef: setScrollRoot,
    zoom,
    navigation,
    pageSizes,
    rotation,
    display,
    setDisplay,
    tool,
    setTool,
    isPanning,
    observe,
  };
}
