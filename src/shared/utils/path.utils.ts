/** Matches strings that start with a URI scheme, e.g. `content://` or `file://`. */
const URI_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;

/** Splits on both Linux (`/`) and Windows (`\`) separators. */
const SEPARATOR = /[\\/]/;

/**
 * Last segment of a file path or URI, used as the display name.
 * URIs (e.g. Android `content://…/document%2Freport.pdf`) are percent-encoded,
 * so they are decoded; plain paths are not, since `%` is a valid file name character.
 */
export function getFileName(path: string): string {
  const name = path.split(SEPARATOR).pop() || path;
  return URI_SCHEME.test(path) ? safeDecode(name) : name;
}

/**
 * Name of the folder containing the file, for the "Location" column:
 * "/home/me/Documents/report.pdf" → "Documents".
 * URIs have no meaningful folder, so they return an empty string.
 */
export function getParentFolderName(path: string): string {
  if (URI_SCHEME.test(path)) return "";
  const segments = path.split(SEPARATOR).filter(Boolean);
  return segments.at(-2) ?? "";
}

/** decodeURIComponent throws on malformed input; fall back to the raw value. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
