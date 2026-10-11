/** Types for the viewer module (displaying a loaded PDF). */
import type { RefObject } from "react";
import type { OpenedDocument } from "@/modules/document/document.types";
import type { PageSize, PdfDocument } from "@/modules/pdf/pdf.types";
import type { Point } from "@/shared/hooks/hooks.types";

/**
 * "fit-width": scale follows the window width (recomputed on resize).
 * "custom": a fixed scale chosen with +/−.
 */
export type ZoomMode = "fit-width" | "custom";

export interface ZoomState {
  mode: ZoomMode;
  /** Only meaningful in "custom" mode. */
  scale: number;
}

/** Everything the UI needs to show and change the zoom (returned by useZoom). */
export interface ZoomControl {
  /** The effective scale currently applied to the pages. */
  scale: number;
  mode: ZoomMode;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fitWidth: () => void;
}

/** Returned by useScrollAnchor. */
export interface ScrollAnchor {
  /** Point (px from the scroll area's top-left) that stays fixed during the next zoom change. */
  setAnchor: (point: Point) => void;
}

/** Current page and a way to jump to another (returned by usePageNavigation). */
export interface PageNavigation {
  currentPage: number;
  pageCount: number;
  goToPage: (pageNumber: number) => void;
}

/**
 * Loading a PDF as a "discriminated union": `status` tells TypeScript which
 * fields exist, so `pdf` can only be accessed once status === "ready".
 */
export type PdfLoadState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; pdf: PdfDocument; pageSizes: PageSize[] };

export interface DocumentViewerProps {
  document: OpenedDocument;
  /** False while the viewer's tab is in the background; disables its keyboard shortcuts. */
  isActive: boolean;
}

export interface ViewerCanvasProps {
  pdf: PdfDocument;
  pageSizes: PageSize[];
  isActive: boolean;
}

export interface PageListProps {
  pdf: PdfDocument;
  pageSizes: PageSize[];
  scale: number;
  /** The scrolling element; pages use it to detect when they're near the screen. */
  scrollRoot: HTMLElement | null;
}

export interface PdfPageProps {
  pdf: PdfDocument;
  pageNumber: number;
  size: PageSize;
  scale: number;
  scrollRoot: HTMLElement | null;
}

export interface PageRenderOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  pdf: PdfDocument;
  pageNumber: number;
  scale: number;
  /** Render only when true (page near the screen). */
  enabled: boolean;
}

export interface ViewerToolbarProps {
  zoom: ZoomControl;
  navigation: PageNavigation;
}

export interface ZoomControlsProps {
  zoom: ZoomControl;
}

export interface PageNavigatorProps {
  navigation: PageNavigation;
}

export interface ViewerMessageProps {
  title: string;
  description?: string;
}
