/**
 * The pdf module is the only place that imports pdf.js. Everything else uses
 * these types, so swapping or upgrading the PDF engine only touches this module.
 */
import type { RefObject } from "react";
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
  /** Clockwise view rotation in degrees, applied on top of the page's own rotation. */
  rotation: number;
  /** Where to build the page's fillable form fields; without it they're drawn as part of the canvas. */
  formLayer?: HTMLElement | null;
  /** Called with the page's real size at 100% (unrotated by the view), before it is drawn. */
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

/** One run of text on a page. Same order as the text layer's elements. */
export interface PdfTextItem {
  str: string;
  /** The run ends a line. */
  hasEOL: boolean;
}

export interface TextLayerOptions {
  pdf: PdfDocument;
  pageNumber: number;
  /** Element the text spans are created in (sized and rotated by pdf.js). */
  container: HTMLElement;
  scale: number;
  rotation: number;
}

/** A rendered text layer: element `i` shows text item `i` (see getTextItems). */
export interface TextLayerHandle {
  textDivs: HTMLElement[];
  itemStrings: string[];
}

export interface TextLayerJob {
  promise: Promise<TextLayerHandle>;
  cancel: () => void;
}

/** A bookmark target: a named destination or pdf.js's explicit array form. */
export type PdfDestination = string | unknown[];

/** pdf.js's own outline item type (internal to the service). */
export type PdfjsOutlineItem = Awaited<ReturnType<PDFDocumentProxy["getOutline"]>>[number];

/** One bookmark and its children. `id` is its position in the tree ("0.2.1"). */
export interface PdfOutlineNode {
  id: string;
  title: string;
  /** null for bookmarks that only link outside the document. */
  dest: PdfDestination | null;
  children: PdfOutlineNode[];
}

/** Where to scroll: a page, and how far down it (0 = top edge, 1 = bottom edge). */
export interface PageTarget {
  pageNumber: number;
  topRatio: number;
}

/** Document information shown in "Document properties". Missing fields are null. */
export interface PdfMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  created: Date | null;
  modified: Date | null;
  pdfVersion: string | null;
}

/** Options of usePdfPageRender. */
export interface PageRenderOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  pdf: PdfDocument;
  pageNumber: number;
  scale: number;
  rotation: number;
  /** Render only when true (page near the screen, tab active). */
  enabled: boolean;
  /** Element for the fillable form fields (viewer pages); thumbnails leave it out. */
  formLayerRef?: RefObject<HTMLElement | null>;
  onPageSize?: (pageNumber: number, size: PageSize) => void;
}

/** The subset of pdf.js's link service its annotation layer calls. */
export interface PdfLinkService {
  eventBus: null;
  addLinkAttributes: (link: HTMLAnchorElement, url: string, newWindow?: boolean) => void;
  getDestinationHash: (dest: unknown) => string;
  getAnchorUrl: (hash: string) => string;
  goToDestination: (dest: unknown) => Promise<void>;
  executeNamedAction: (action: string) => void;
  executeSetOCGState: (action: object) => Promise<void>;
  getAttachmentContent: (attachment: object) => Promise<Uint8Array | null>;
}

/** Options of usePdfTextLayer. */
export interface TextLayerHookOptions {
  containerRef: RefObject<HTMLElement | null>;
  pdf: PdfDocument;
  pageNumber: number;
  scale: number;
  rotation: number;
  enabled: boolean;
}

/** A point in the page's viewport at scale 1 (top-left origin, y down). */
export interface PathPoint {
  x: number;
  y: number;
}

/** A straight line to `end`, or a cubic Bézier curve when both control points are set. */
export interface PathSegment {
  c1?: PathPoint;
  c2?: PathPoint;
  end: PathPoint;
}

/** An open line or a closed outline, as lines and curves. */
export interface PdfPath {
  start: PathPoint;
  segments: PathSegment[];
}

/**
 * A freehand stroke to write into the PDF as an Ink annotation: either a stroked
 * line of fixed width, or a filled outline (variable width, or a highlighter).
 */
export interface PdfInkStroke {
  id: string;
  /** 1-based. */
  pageNumber: number;
  /** "#rrggbb". */
  color: string;
  /** Line width in points (stroked lines). */
  thickness: number;
  opacity: number;
  /** true: `path` is a closed outline to fill. false: a line to stroke. */
  filled: boolean;
  path: PdfPath;
  /** The centre line, for the annotation's InkList (what readers use to edit or describe it). */
  points: PathPoint[];
}

/** The change hooks of pdf.js's AnnotationStorage, with their real types. */
export interface FormChangeHooks {
  onSetModified: (() => void) | null;
  onResetModified: (() => void) | null;
}
