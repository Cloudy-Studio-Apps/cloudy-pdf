/** Tuning values and Rust command names for the pdf module. */
import type { PdfLinkService } from "./pdf.types";

/**
 * Bytes per range request. pdf.js merges adjacent missing chunks into one
 * request, and an IPC round trip costs far more than reading 256 KiB from
 * disk, so chunks are larger than pdf.js's 64 KiB default.
 */
export const RANGE_CHUNK_SIZE = 256 * 1024;

/**
 * Largest canvas bitmap, in pixels. Above roughly this size WebKit and Android
 * WebViews silently draw a blank canvas, which can happen at high zoom on
 * HiDPI screens. Past the cap, pages are drawn at a lower pixel ratio: a bit
 * soft, but never blank. (pdf.js's own viewer has the same kind of limit.)
 */
export const MAX_CANVAS_PIXELS = 2 ** 24;

// Must match the commands in `src-tauri/src/document_source.rs`.
export const OPEN_DOCUMENT_COMMAND = "open_document";
export const READ_DOCUMENT_RANGE_COMMAND = "read_document_range";
export const CLOSE_DOCUMENT_COMMAND = "close_document";

/**
 * Keys of new annotations in pdf.js's annotationStorage must start with this
 * prefix (pdf.js's `AnnotationEditorPrefix`), or saveDocument ignores them.
 */
export const NEW_ANNOTATION_PREFIX = "pdfjs_internal_editor_";

/**
 * The annotation layer needs a "link service" to wire up links. Links aren't
 * supported yet, so they're inert: no href, and clicking does nothing.
 */
export const NO_LINKS: PdfLinkService = {
  eventBus: null,
  addLinkAttributes: () => undefined,
  getDestinationHash: () => "#",
  getAnchorUrl: () => "#",
  goToDestination: async () => undefined,
  executeNamedAction: () => undefined,
  executeSetOCGState: async () => undefined,
  getAttachmentContent: async () => null,
};
