/** Helpers for the viewer module: pure math and read-only DOM lookups. */
import type { PageSize } from "@/modules/pdf/pdf.types";
import { PAGE_SELECTOR, WHEEL_LINE_HEIGHT } from "./viewer.constants";

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
