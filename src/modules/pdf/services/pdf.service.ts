/**
 * Thin wrapper around pdf.js: load a document, measure pages, draw a page on a canvas.
 */
import { GlobalWorkerOptions, RenderingCancelledException, getDocument } from "pdfjs-dist";
// `?url` is a Vite feature: it bundles the worker file and gives us its final URL.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PageSize, PdfDocument, PdfLoadJob, RenderJob, RenderPageOptions } from "../pdf.types";

// pdf.js parses PDFs in a Web Worker (a background thread) so the UI never freezes.
// It must be told where that worker script lives.
GlobalWorkerOptions.workerSrc = workerUrl;

/** Starts loading a PDF from raw bytes. */
export function loadPdf(data: Uint8Array): PdfLoadJob {
  // pdf.js transfers the buffer to its worker (the original becomes empty),
  // so hand it a copy and keep our bytes usable for a reload.
  const task = getDocument({ data: data.slice() });
  return { promise: task.promise, destroy: () => task.destroy() };
}

/**
 * Size of every page at 100%. Measured up front so the viewer can lay out
 * correctly sized placeholders for all pages before any of them is drawn;
 * that keeps the scrollbar and "go to page" accurate.
 */
export async function getPageSizes(pdf: PdfDocument): Promise<PageSize[]> {
  const pageNumbers = Array.from({ length: pdf.numPages }, (_, index) => index + 1);
  return Promise.all(
    pageNumbers.map(async (pageNumber) => {
      const { width, height } = (await pdf.getPage(pageNumber)).getViewport({ scale: 1 });
      return { width, height };
    }),
  );
}

/** Draws one page onto a canvas at the given zoom. Returns a cancellable job. */
export function renderPage({ pdf, pageNumber, canvas, scale }: RenderPageOptions): RenderJob {
  // Two-step cancellation: the job may be cancelled while the page is still
  // being fetched (`cancelled` flag) or while it is drawing (`cancelTask`).
  let cancelTask: (() => void) | null = null;
  let cancelled = false;

  const promise = pdf.getPage(pageNumber).then((page) => {
    if (cancelled) return;

    // HiDPI screens have 2+ physical pixels per CSS pixel. Drawing the canvas at
    // physical resolution (then displaying it at CSS size) keeps text sharp.
    const pixelRatio = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale });
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

/** Cancelling a render rejects its promise; this tells that apart from a real error. */
export function isRenderCancelled(error: unknown): boolean {
  return error instanceof RenderingCancelledException;
}
