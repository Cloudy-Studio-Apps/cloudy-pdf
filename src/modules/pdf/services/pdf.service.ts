import { GlobalWorkerOptions, RenderingCancelledException, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PageSize, PdfDocument, PdfLoadJob, RenderJob, RenderPageOptions } from "../pdf.types";

GlobalWorkerOptions.workerSrc = workerUrl;

export function loadPdf(data: Uint8Array): PdfLoadJob {
  // pdf.js transfers the buffer to its worker, so hand it a copy.
  const task = getDocument({ data: data.slice() });
  return { promise: task.promise, destroy: () => task.destroy() };
}

export async function getPageSizes(pdf: PdfDocument): Promise<PageSize[]> {
  const pageNumbers = Array.from({ length: pdf.numPages }, (_, index) => index + 1);
  return Promise.all(
    pageNumbers.map(async (pageNumber) => {
      const { width, height } = (await pdf.getPage(pageNumber)).getViewport({ scale: 1 });
      return { width, height };
    }),
  );
}

export function renderPage({ pdf, pageNumber, canvas, scale }: RenderPageOptions): RenderJob {
  let cancelTask: (() => void) | null = null;
  let cancelled = false;

  const promise = pdf.getPage(pageNumber).then((page) => {
    if (cancelled) return;

    const pixelRatio = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale });
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);

    const task = page.render({
      canvas,
      viewport,
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

export function isRenderCancelled(error: unknown): boolean {
  return error instanceof RenderingCancelledException;
}
