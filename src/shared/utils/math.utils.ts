/** Restricts `value` to the [min, max] range (used for zoom limits and page numbers). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Formats a ratio for display: 1.25 → "125%". */
export function toPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
