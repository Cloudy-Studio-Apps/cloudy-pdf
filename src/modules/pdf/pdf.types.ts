import type { PDFDocumentProxy } from "pdfjs-dist";

export type PdfDocument = PDFDocumentProxy;

export interface PageSize {
  width: number;
  height: number;
}

export interface RenderPageOptions {
  pdf: PdfDocument;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  scale: number;
}

export interface RenderJob {
  promise: Promise<void>;
  cancel: () => void;
}

export interface PdfLoadJob {
  promise: Promise<PdfDocument>;
  destroy: () => Promise<void>;
}
