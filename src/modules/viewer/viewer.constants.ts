export const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;
export const MIN_ZOOM = ZOOM_STEPS[0];
export const MAX_ZOOM = ZOOM_STEPS[ZOOM_STEPS.length - 1];

/** Horizontal breathing room around pages, in px. */
export const PAGE_GUTTER = 32;

/** How far outside the viewport pages are pre-rendered. */
export const RENDER_MARGIN = "800px 0px";

/** Fraction of the viewport height used to decide the current page. */
export const CURRENT_PAGE_THRESHOLD = 0.35;
