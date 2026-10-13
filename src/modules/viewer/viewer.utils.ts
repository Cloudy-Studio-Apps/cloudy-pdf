/** Helpers for the viewer module: pure math, page lookups and text highlight DOM writes. */
import type { PageSize, TextLayerHandle } from "@/modules/pdf/pdf.types";
import type { ElementSize } from "@/shared/hooks/hooks.types";
import {
  FIT_PAGE_VERTICAL_SPACE,
  PAGE_GUTTER,
  PAGE_SELECTOR,
  POINTS_PER_MM,
  SIDE_PANELS,
  WHEEL_LINE_HEIGHT,
} from "./viewer.constants";
import type { PageHighlight, Rotation, SidePanelId } from "./viewer.types";

/**
 * Vertical wheel distance in pixels, whatever unit the browser reported.
 * deltaMode: 0 = pixels, 1 = lines, 2 = pages (`pageHeight` is one page of scrolling).
 */
export function wheelDeltaInPixels(event: WheelEvent, pageHeight: number): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * WHEEL_LINE_HEIGHT;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * pageHeight;
  return event.deltaY;
}

/** Same-size check for page sizes (exact: both come from the same pdf.js numbers). */
export function isSameSize(a: PageSize, b: PageSize): boolean {
  return a.width === b.width && a.height === b.height;
}

/** Turns a rotation by ±90° steps, staying within 0–270. */
export function rotateBy(rotation: Rotation, degrees: number): Rotation {
  return ((((rotation + degrees) % 360) + 360) % 360) as Rotation;
}

/**
 * Scale that fits `page` (already rotated for display) into the viewport, or
 * null before the viewport has been measured.
 */
export function computeFitScale(mode: "fit-width" | "fit-page", page: PageSize, viewport: ElementSize): number | null {
  if (!viewport.width || !viewport.height || !page.width || !page.height) return null;
  const byWidth = (viewport.width - PAGE_GUTTER * 2) / page.width;
  if (mode === "fit-width") return byWidth;
  return Math.min(byWidth, (viewport.height - FIT_PAGE_VERTICAL_SPACE) / page.height);
}

/** "210 × 297 mm" from a size in points. */
export function formatPageSize(size: PageSize): string {
  const millimetres = (points: number) => Math.round(points / POINTS_PER_MM);
  return `${millimetres(size.width)} × ${millimetres(size.height)} mm`;
}

export function getSidePanelLabel(panel: SidePanelId): string {
  return SIDE_PANELS.find((item) => item.id === panel)?.label ?? "";
}

/** All page elements of the viewer, in page order (see `data-page-number` on PdfPage). */
export function getPageElements(container: HTMLElement): NodeListOf<HTMLElement> {
  return container.querySelectorAll<HTMLElement>(PAGE_SELECTOR);
}

export function getPageElement(container: HTMLElement, pageNumber: number): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-page-number="${pageNumber}"]`);
}

/**
 * The page under vertical position `y` (px in the scroll content): the last page
 * whose top edge is at or above it, or null if there are no pages.
 *
 * Binary search, since pages are stacked in order: about 11 layout reads for a
 * 2,000-page document, instead of reading every page's position on each scroll.
 */
export function findPageAt(container: HTMLElement, y: number): HTMLElement | null {
  const pages = getPageElements(container);
  if (pages.length === 0) return null;

  let low = 0;
  let high = pages.length - 1;
  while (low < high) {
    // Round up so `low = middle` always makes progress.
    const middle = Math.ceil((low + high) / 2);
    if (pages[middle].offsetTop <= y) low = middle;
    else high = middle - 1;
  }
  return pages[low];
}

/** True if any part of the element is inside the scroll container's visible area. */
export function isOnScreen(container: HTMLElement, element: HTMLElement): boolean {
  const top = container.scrollTop;
  return element.offsetTop < top + container.clientHeight && element.offsetTop + element.offsetHeight > top;
}

/**
 * Marks search matches in a page's text layer by wrapping the matched characters
 * of each span in <mark> elements (styled in index.css). Spans touched by a
 * previous call are reset first. Returns the current match's first mark, if any.
 */
export function applyHighlights(layer: TextLayerHandle, highlights: readonly PageHighlight[]): HTMLElement | null {
  const { textDivs, itemStrings } = layer;
  for (let index = 0; index < textDivs.length; index++) {
    if (textDivs[index].childElementCount > 0) textDivs[index].textContent = itemStrings[index];
  }

  const rangesByItem = new Map<number, Array<{ start: number; end: number; current: boolean }>>();
  for (const highlight of highlights) {
    for (const range of highlight.ranges) {
      const list = rangesByItem.get(range.itemIndex) ?? [];
      list.push({ start: range.start, end: range.end, current: highlight.current });
      rangesByItem.set(range.itemIndex, list);
    }
  }

  let currentMark: HTMLElement | null = null;
  for (const [index, ranges] of rangesByItem) {
    const div = textDivs[index];
    const text = itemStrings[index];
    if (!div || text === undefined) continue;

    ranges.sort((a, b) => a.start - b.start);
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const range of ranges) {
      const start = Math.max(range.start, cursor);
      if (start > cursor) fragment.append(text.slice(cursor, start));
      if (range.end <= start) continue;
      const mark = document.createElement("mark");
      mark.textContent = text.slice(start, range.end);
      if (range.current) {
        mark.classList.add("current");
        currentMark ??= mark;
      }
      fragment.append(mark);
      cursor = range.end;
    }
    if (cursor < text.length) fragment.append(text.slice(cursor));
    div.replaceChildren(fragment);
  }
  return currentMark;
}
