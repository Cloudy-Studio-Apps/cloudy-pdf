import type { RefObject } from "react";
import type { OpenedDocument } from "@/modules/document/document.types";
import type { PageSize, PdfDocument } from "@/modules/pdf/pdf.types";

export type ZoomMode = "fit-width" | "custom";

export interface ZoomState {
  mode: ZoomMode;
  scale: number;
}

export interface ZoomControl {
  scale: number;
  mode: ZoomMode;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  fitWidth: () => void;
}

export interface PageNavigation {
  currentPage: number;
  pageCount: number;
  goToPage: (pageNumber: number) => void;
}

export type PdfLoadState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; pdf: PdfDocument; pageSizes: PageSize[] };

export interface DocumentViewerProps {
  document: OpenedDocument;
}

export interface ViewerCanvasProps {
  pdf: PdfDocument;
  pageSizes: PageSize[];
}

export interface PageListProps {
  pdf: PdfDocument;
  pageSizes: PageSize[];
  scale: number;
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
