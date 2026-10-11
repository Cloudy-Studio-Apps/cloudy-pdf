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
  /** Called with the page's real size at 100%, once known, before it is drawn. */
  onPageSize?: (size: PageSize) => void;
}

/** A running page render that can be cancelled (e.g. the page scrolled away or zoom changed). */
export interface RenderJob {
  promise: Promise<void>;
  cancel: () => void;
}

/** A document opened on the Rust side, whose bytes are read on demand (`open_document`). */
export interface PdfSource {
  id: number;
  /** File size in bytes. */
  size: number;
}

/** A document being loaded; `destroy` frees the worker memory, even mid-load. */
export interface PdfLoadJob {
  promise: Promise<PdfDocument>;
  destroy: () => Promise<void>;
}
