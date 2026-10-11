/** Pure helpers for the viewer module. */
import { WHEEL_LINE_HEIGHT } from "./viewer.constants";

/**
 * Vertical wheel distance in pixels, whatever unit the browser reported.
 * deltaMode: 0 = pixels, 1 = lines, 2 = pages (`pageHeight` is one page of scrolling).
 */
export function wheelDeltaInPixels(event: WheelEvent, pageHeight: number): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * WHEEL_LINE_HEIGHT;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * pageHeight;
  return event.deltaY;
}
