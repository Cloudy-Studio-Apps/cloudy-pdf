/**
 * Thin wrapper around pdf.js: load a document, measure and draw pages (with their
 * fillable form fields), read text, bookmarks and document information, and
 * export the document with the values typed into its fields.
 */
import {
  AbortException,
  AnnotationEditorType,
  AnnotationLayer,
  AnnotationMode,
  GlobalWorkerOptions,
  PDFDataRangeTransport,
  PDFDateString,
  RenderingCancelledException,
  TextLayer,
  getDocument,
  type PDFDocumentLoadingTask,
  type PDFPageProxy,
} from "pdfjs-dist";
// `?url` is a Vite feature: it bundles the worker file and gives us its final URL.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { clamp } from "@/shared/utils/math.utils";
import { MAX_CANVAS_PIXELS, NEW_ANNOTATION_PREFIX, NO_LINKS, RANGE_CHUNK_SIZE } from "../pdf.constants";
import { hexToRgb } from "../pdf.utils";
import type {
  FormChangeHooks,
  PageSize,
  PageTarget,
  PdfDestination,
  PdfDocument,
  PdfInkStroke,
  PdfjsOutlineItem,
  PdfLoadJob,
  PdfMetadata,
  PdfOutlineNode,
  PdfSource,
  PdfTextItem,
  RenderJob,
  RenderPageOptions,
  TextLayerJob,
  TextLayerOptions,
} from "../pdf.types";
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

/**
 * pdf.js's `getViewport({ rotation })` *replaces* the page's own /Rotate instead of
 * adding to it, so the view rotation is always combined with it here.
 */
function totalRotation(page: PDFPageProxy, rotation: number): number {
  return (page.rotate + rotation) % 360;
}

/** Size of one page at 100%, in PDF points (its own rotation included). */
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

/**
 * Draws one page onto a canvas at the given zoom and rotation. Returns a cancellable job.
 *
 * With `formLayer`, form fields become real inputs in it, drawn after the page.
 * The canvas then leaves the fields out (`ENABLE_FORMS`), or each would show twice.
 */
export function renderPage({
  pdf,
  pageNumber,
  canvas,
  scale,
  rotation,
  formLayer,
  onPageSize,
}: RenderPageOptions): RenderJob {
  // Two-step cancellation: the job may be cancelled while the page is still
  // being fetched (`cancelled` flag) or while it is drawing (`cancelTask`).
  let cancelTask: (() => void) | null = null;
  let cancelled = false;

  const promise = pdf.getPage(pageNumber).then(async (page) => {
    if (cancelled) return;

    // The viewer only knows page 1's size up front; this reports the real one.
    const base = page.getViewport({ scale: 1 });
    onPageSize?.({ width: base.width, height: base.height });

    // HiDPI screens have 2+ physical pixels per CSS pixel. Drawing the canvas at
    // physical resolution (then displaying it at CSS size) keeps text sharp.
    const viewport = page.getViewport({ scale, rotation: totalRotation(page, rotation) });
    const pixelRatio = canvasPixelRatio(viewport.width, viewport.height);
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);

    // Checkboxes and radio buttons draw their checked / unchecked looks into small
    // canvases of their own, which the form layer then shows over its inputs.
    const annotationCanvasMap = formLayer ? new Map<string, HTMLCanvasElement>() : undefined;
    const task = page.render({
      canvas,
      viewport,
      // Scale matrix [a, b, c, d, e, f]: enlarges the drawing by pixelRatio to fill the bigger canvas.
      transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
      annotationMode: formLayer ? AnnotationMode.ENABLE_FORMS : AnnotationMode.ENABLE,
      annotationCanvasMap,
    });
    cancelTask = () => task.cancel();
    await task.promise;
    if (formLayer && !cancelled) await renderFormLayer(pdf, page, formLayer, viewport, annotationCanvasMap);
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
 * Builds the page's annotation layer: inputs for form fields (and inert links).
 * Values live in the document's `annotationStorage`, not in the inputs, so they
 * survive the page scrolling away or being redrawn at another zoom.
 *
 * The layer goes in a new element, so if the job is cancelled meanwhile (the
 * caller then empties `container`), a late finish lands in a detached element.
 */
async function renderFormLayer(
  pdf: PdfDocument,
  page: PDFPageProxy,
  container: HTMLElement,
  viewport: ReturnType<PDFPageProxy["getViewport"]>,
  annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined,
): Promise<void> {
  const annotations = await page.getAnnotations({ intent: "display" });
  if (annotations.length === 0) return;

  const div = document.createElement("div");
  div.className = "annotationLayer";
  container.replaceChildren(div);
  // pdf.js positions the layer itself and rotates it with CSS (data-main-rotation),
  // so it wants the viewport unflipped, like its own viewer does.
  const layerViewport = viewport.clone({ dontFlip: true });
  const layer = new AnnotationLayer({
    div,
    page,
    viewport: layerViewport,
    annotationCanvasMap,
    annotationStorage: pdf.annotationStorage,
    linkService: NO_LINKS,
    accessibilityManager: null,
    annotationEditorUIManager: null,
    structTreeLayer: null,
    commentManager: null,
  });
  await layer.render({
    div,
    page,
    viewport: layerViewport,
    annotations,
    annotationCanvasMap,
    annotationStorage: pdf.annotationStorage,
    // Typed as pdf.js's full viewer link service, but the layer only calls these methods.
    linkService: NO_LINKS as unknown as Parameters<AnnotationLayer["render"]>[0]["linkService"],
    renderForms: true,
  });
}

/**
 * The whole document with the values typed into its form fields, as PDF bytes
 * (pdf.js appends them as an incremental update). This is the one place the whole
 * file is read: pdf.js fetches every range it doesn't have yet.
 */
export function exportPdf(pdf: PdfDocument): Promise<Uint8Array> {
  return pdf.saveDocument();
}

/** Storage keys of the strokes last handed to pdf.js, per document, so the next call can replace them. */
const writtenInkKeys = new WeakMap<PdfDocument, string[]>();

/**
 * Hands the user's strokes to pdf.js, so the next `exportPdf` writes them as Ink
 * annotations (with an appearance stream, so every reader shows them).
 *
 * This uses pdf.js's internal editor format: what its own InkEditor.serialize()
 * produces, put in annotationStorage under a `pdfjs_internal_editor_` key. It is
 * the only code relying on it; re-check it when upgrading pdf.js
 * (InkEditor.serialize and InkAnnotation.createNewDict in the worker).
 */
export async function setInkAnnotations(pdf: PdfDocument, strokes: PdfInkStroke[]): Promise<void> {
  const storage = pdf.annotationStorage;
  for (const key of writtenInkKeys.get(pdf) ?? []) storage.remove(key);

  const entries = await Promise.all(
    strokes.map(async (stroke) => {
      const page = await pdf.getPage(stroke.pageNumber);
      return [`${NEW_ANNOTATION_PREFIX}ink-${stroke.id}`, toInkData(page, stroke)] as const;
    }),
  );
  for (const [key, data] of entries) storage.setValue(key, data);
  writtenInkKeys.set(
    pdf,
    entries.map(([key]) => key),
  );
}

/** One stroke in the serialized InkEditor shape, in PDF coordinates (origin bottom-left). */
function toInkData(page: PDFPageProxy, stroke: PdfInkStroke) {
  const viewport = page.getViewport({ scale: 1 });
  const points = stroke.points.flatMap(({ x, y }) => viewport.convertToPdfPoint(x, y) as [number, number]);

  // `lines` holds Bézier segments of 6 numbers: 2 control points, then the end
  // point. NaN control points mean a straight line, so this draws a polyline.
  const lines = new Float32Array(points.length * 3);
  lines.fill(Number.NaN);
  for (let i = 0; i < points.length; i += 2) {
    lines[i * 3 + 4] = points[i];
    lines[i * 3 + 5] = points[i + 1];
  }

  const half = stroke.thickness / 2;
  const xs = points.filter((_, i) => i % 2 === 0);
  const ys = points.filter((_, i) => i % 2 === 1);
  return {
    annotationType: AnnotationEditorType.INK,
    pageIndex: stroke.pageNumber - 1,
    rect: [Math.min(...xs) - half, Math.min(...ys) - half, Math.max(...xs) + half, Math.max(...ys) + half],
    rotation: 0,
    color: hexToRgb(stroke.color),
    thickness: stroke.thickness,
    opacity: 1,
    paths: { lines: [lines], points: [Float32Array.from(points)] },
    structTreeParentId: null,
    popupRef: "",
  };
}

/** Calls `onChange(true)` when a field is first edited, `onChange(false)` after markSaved. Returns an unsubscribe. */
export function watchFormChanges(pdf: PdfDocument, onChange: (modified: boolean) => void): () => void {
  // pdf.js types these hooks as `null` only, though they take a callback.
  const storage = pdf.annotationStorage as unknown as FormChangeHooks;
  storage.onSetModified = () => onChange(true);
  storage.onResetModified = () => onChange(false);
  return () => {
    storage.onSetModified = null;
    storage.onResetModified = null;
  };
}

/** The current values are on disk: the next edit makes the document modified again. */
export function markSaved(pdf: PdfDocument): void {
  pdf.annotationStorage.resetModified();
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

/** Cancelling a render or a text layer rejects its promise; this tells that apart from a real error. */
export function isRenderCancelled(error: unknown): boolean {
  return error instanceof RenderingCancelledException || error instanceof AbortException;
}

/**
 * A page's text runs. Same filter as pdf.js's TextLayer (items that have a `str`),
 * so index `i` here is element `i` of the page's text layer: search relies on it.
 */
export async function getTextItems(pdf: PdfDocument, pageNumber: number): Promise<PdfTextItem[]> {
  const page = await pdf.getPage(pageNumber);
  const { items } = await page.getTextContent();
  return items
    .filter((item): item is Extract<(typeof items)[number], { str: string }> => "str" in item)
    .map(({ str, hasEOL }) => ({ str, hasEOL }));
}

/**
 * Builds the invisible, selectable text over a page canvas. pdf.js positions each
 * span in percentages of the page; the container's `--total-scale-factor` CSS
 * variable (set by the caller to `scale`) sizes the fonts.
 */
export function renderTextLayer({ pdf, pageNumber, container, scale, rotation }: TextLayerOptions): TextLayerJob {
  let layer: TextLayer | null = null;
  let cancelled = false;

  const promise = pdf.getPage(pageNumber).then(async (page) => {
    if (cancelled) throw new AbortException("Text layer cancelled");
    layer = new TextLayer({
      textContentSource: page.streamTextContent(),
      container,
      viewport: page.getViewport({ scale, rotation: totalRotation(page, rotation) }),
    });
    await layer.render();
    return { textDivs: layer.textDivs, itemStrings: layer.textContentItemsStr };
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      layer?.cancel();
    },
  };
}

/** The document's bookmarks as a tree (empty if it has none). */
export async function getOutline(pdf: PdfDocument): Promise<PdfOutlineNode[]> {
  const toNode = (item: PdfjsOutlineItem, id: string): PdfOutlineNode => ({
    id,
    title: item.title,
    dest: item.dest ?? null,
    children: item.items.map((child: PdfjsOutlineItem, index: number) => toNode(child, `${id}.${index}`)),
  });
  const outline = await pdf.getOutline();
  return (outline ?? []).map((item, index) => toNode(item, String(index)));
}

/**
 * Turns a bookmark destination into a page and vertical position.
 * Explicit destinations look like `[pageRef, { name: "XYZ" }, left, top, zoom]`.
 */
export async function resolveDestination(pdf: PdfDocument, dest: PdfDestination): Promise<PageTarget | null> {
  const explicit = typeof dest === "string" ? await pdf.getDestination(dest) : dest;
  if (!Array.isArray(explicit) || explicit.length === 0) return null;

  const [ref, mode, ...args] = explicit as [unknown, { name?: string } | undefined, ...unknown[]];
  const pageIndex =
    typeof ref === "number" ? ref : await pdf.getPageIndex(ref as Parameters<PdfDocument["getPageIndex"]>[0]);
  const page = await pdf.getPage(pageIndex + 1);
  return { pageNumber: pageIndex + 1, topRatio: destinationTopRatio(page.view, mode?.name, args) };
}

/**
 * XYZ / FitH / FitBH carry a "top" coordinate in PDF units, measured from the
 * page's bottom edge; every other mode shows the page from its top.
 */
function destinationTopRatio(view: number[], mode: string | undefined, args: unknown[]): number {
  const top = mode === "XYZ" ? args[1] : mode === "FitH" || mode === "FitBH" ? args[0] : null;
  if (typeof top !== "number") return 0;
  const [, bottom, , pageTop] = view;
  return clamp((pageTop - top) / (pageTop - bottom), 0, 1);
}

/** Document information for "Document properties". */
export async function getMetadata(pdf: PdfDocument): Promise<PdfMetadata> {
  const { info } = await pdf.getMetadata();
  const fields = info as Record<string, unknown>;
  const text = (key: string): string | null => {
    const value = fields[key];
    return typeof value === "string" && value.trim() ? value : null;
  };
  const date = (key: string): Date | null => {
    const value = text(key);
    return value ? PDFDateString.toDateObject(value) : null;
  };

  return {
    title: text("Title"),
    author: text("Author"),
    subject: text("Subject"),
    creator: text("Creator"),
    producer: text("Producer"),
    created: date("CreationDate"),
    modified: date("ModDate"),
    pdfVersion: text("PDFFormatVersion"),
  };
}
