/** Tuning values for the viewer, kept in one place so behaviour is easy to adjust. */

/** Zoom levels used by the +/− buttons, Ctrl+= / Ctrl+− and Ctrl+wheel. */
export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;
export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

/** Horizontal breathing room around pages, in px. Matches `px-8` in PageList. */
export const PAGE_GUTTER = 32;

/**
 * How far outside the viewport pages are pre-rendered.
 * Pages within 800px above/below the screen start drawing early,
 * so they're usually ready by the time you scroll to them.
 */
export const RENDER_MARGIN = "800px 0px";

/**
 * Where the "current page" line sits, as a fraction of the viewport height
 * from the top. A page becomes current once its top passes 35% of the screen,
 * which feels more natural than switching only when it reaches the very top.
 */
export const CURRENT_PAGE_THRESHOLD = 0.35;

/**
 * Ctrl+wheel distance (px) that counts as one zoom step.
 * A mouse wheel notch is usually ≥ 50px, so each notch is one step (like Acrobat).
 * Touchpads send many tiny deltas; they add up until they reach this amount,
 * so pinch / two-finger zoom isn't wildly fast.
 */
export const WHEEL_ZOOM_STEP = 50;

/** Pixel size of one "line" when the wheel reports lines (Firefox-style deltaMode 1). */
export const WHEEL_LINE_HEIGHT = 16;

/** Every page element carries `data-page-number` (see PdfPage); this finds them without a ref per page. */
export const PAGE_SELECTOR = "[data-page-number]";
