/** Tuning values for the viewer, kept in one place so behaviour is easy to adjust. */

/** Zoom levels used by the +/− buttons and Ctrl+= / Ctrl+−. */
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
