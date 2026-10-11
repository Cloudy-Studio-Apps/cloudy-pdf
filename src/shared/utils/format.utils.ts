const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const;

/** Human-readable file size: 1536 → "1.5 KB". */
export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  // No decimals for bytes or big numbers (e.g. "12 MB", not "12.0 MB").
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${BYTE_UNITS[unit]}`;
}

// Largest unit first: the first unit the elapsed time reaches is the one shown.
const TIME_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["week", 7 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

// numeric: "auto" produces natural phrases like "yesterday" instead of "1 day ago".
const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/** "Just now", "5 minutes ago", "yesterday", "3 weeks ago"… */
export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const elapsed = now - timestamp;
  for (const [unit, size] of TIME_UNITS) {
    if (elapsed >= size) return relativeTime.format(-Math.floor(elapsed / size), unit);
  }
  return "Just now";
}
