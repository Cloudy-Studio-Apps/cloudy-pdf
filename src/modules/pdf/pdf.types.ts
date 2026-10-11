/**
 * The pdf module is the only place that imports pdf.js. Everything else uses
 * these types, so swapping or upgrading the PDF engine only touches this module.
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

/** Alias so other modules don't import pdf.js types directly. */
export type PdfDocument = PDFDocumentProxy;

/** Page size in PDF points (1/72 inch) at 100% zoom. */
export interface PageSize {
  width: number;
  height: number;
}

export interface RenderPageOptions {
  pdf: PdfDocument;
  /** 1-based, as in pdf.js. */
  pageNumber: number;
  canvas: HTMLCanvasElement;
  /** Zoom factor: 1 = 100%. */
  scale: number;
}

/** A running page render that can be cancelled (e.g. the page scrolled away or zoom changed). */
export interface RenderJob {
  promise: Promise<void>;
  cancel: () => void;
}

/** A document being loaded; `destroy` frees the worker memory, even mid-load. */
export interface PdfLoadJob {
  promise: Promise<PdfDocument>;
  destroy: () => Promise<void>;
}
