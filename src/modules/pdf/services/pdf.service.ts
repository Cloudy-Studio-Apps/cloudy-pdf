/**
 * Thin wrapper around pdf.js: load a document, measure a page, draw a page on a canvas.
 */
import {
  GlobalWorkerOptions,
  PDFDataRangeTransport,
  RenderingCancelledException,
  getDocument,
  type PDFDocumentLoadingTask,
} from "pdfjs-dist";
// `?url` is a Vite feature: it bundles the worker file and gives us its final URL.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { MAX_CANVAS_PIXELS, RANGE_CHUNK_SIZE } from "../pdf.constants";
import type { PageSize, PdfDocument, PdfLoadJob, PdfSource, RenderJob, RenderPageOptions } from "../pdf.types";
import { closePdfSource, openPdfSource, readPdfRange } from "./pdf-source.service";

// pdf.js parses PDFs in a Web Worker (a background thread) so the UI never freezes.
// It must be told where that worker script lives.
GlobalWorkerOptions.workerSrc = workerUrl;

/** Feeds pdf.js the byte ranges it asks for, read by Rust. */
class RustRangeTransport extends PDFDataRangeTransport {
  #source: PdfSource;
  #aborted = false;

  constructor(source: PdfSource) {
    super(source.size, null);
    this.#source = source;
  }

  override requestDataRange(begin: number, end: number): void {
    readPdfRange(this.#source, begin, end)
      // pdf.js asserts the request still exists, so drop replies that arrive after destroy.
      .then((chunk) => this.#aborted || this.onDataRange(begin, chunk))
      .catch((error) => console.error(`Failed to read bytes ${begin}-${end}`, error));
  }

  override abort(): void {
    this.#aborted = true;
  }
}

/** Starts loading a PDF; only the parts pdf.js needs are ever read from disk. */
export function loadPdf(path: string): PdfLoadJob {
  let task: PDFDocumentLoadingTask | null = null;
  let destroyed = false;
  const source = openPdfSource(path);

  const promise = source.then((opened) => {
    if (destroyed) throw new Error("Loading was cancelled");
    task = getDocument({
      range: new RustRangeTransport(opened),
      rangeChunkSize: RANGE_CHUNK_SIZE,
      // Only fetch what's displayed. Without this, pdf.js downloads the rest of
      // the file in the background, and the whole file ends up in worker memory.
      disableAutoFetch: true,
      // No progressive stream here: every byte comes from a range request.
      disableStream: true,
    });
    return task.promise;
  });

  return {
    promise,
    destroy: async () => {
      destroyed = true;
      await task?.destroy();
      // Release the file in Rust, even if it finished opening after destroy was called.
      await source.then(closePdfSource).catch(() => undefined);
    },
  };
}

/** Size of one page at 100%, in PDF points (rotation included). */
export async function getPageSize(pdf: PdfDocument, pageNumber: number): Promise<PageSize> {
  const { width, height } = (await pdf.getPage(pageNumber)).getViewport({ scale: 1 });
  return { width, height };
}

/**
 * Pixels per CSS pixel for a page drawn at `width` × `height` CSS px:
 * the screen's ratio (sharp text on HiDPI), lowered if the bitmap would be too big.
 */
function canvasPixelRatio(width: number, height: number): number {
  const screenRatio = window.devicePixelRatio || 1;
  const maxRatio = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  return Math.min(screenRatio, maxRatio);
}

/** Draws one page onto a canvas at the given zoom. Returns a cancellable job. */
export function renderPage({ pdf, pageNumber, canvas, scale, onPageSize }: RenderPageOptions): RenderJob {
  // Two-step cancellation: the job may be cancelled while the page is still
  // being fetched (`cancelled` flag) or while it is drawing (`cancelTask`).
  let cancelTask: (() => void) | null = null;
  let cancelled = false;

  const promise = pdf.getPage(pageNumber).then((page) => {
    if (cancelled) return;

    // The viewer only knows page 1's size up front; this reports the real one.
    const base = page.getViewport({ scale: 1 });
    onPageSize?.({ width: base.width, height: base.height });

    // HiDPI screens have 2+ physical pixels per CSS pixel. Drawing the canvas at
    // physical resolution (then displaying it at CSS size) keeps text sharp.
    const viewport = page.getViewport({ scale });
    const pixelRatio = canvasPixelRatio(viewport.width, viewport.height);
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);

    const task = page.render({
      canvas,
      viewport,
      // Scale matrix [a, b, c, d, e, f]: enlarges the drawing by pixelRatio to fill the bigger canvas.
      transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
    });
    cancelTask = () => task.cancel();
    return task.promise;
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      cancelTask?.();
    },
  };
}

/**
 * Frees what pdf.js cached for a page (parsed content, fonts, images) once it has
 * scrolled away. Without this, worker memory grows with every page ever viewed.
 */
export function releasePage(pdf: PdfDocument, pageNumber: number): void {
  pdf
    .getPage(pageNumber)
    .then((page) => page.cleanup())
    // The document may already be destroyed (tab closed); nothing left to free then.
    .catch(() => undefined);
}

/** Cancelling a render rejects its promise; this tells that apart from a real error. */
export function isRenderCancelled(error: unknown): boolean {
  return error instanceof RenderingCancelledException;
}
