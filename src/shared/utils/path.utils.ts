/** Matches strings that start with a URI scheme, e.g. `content://` or `file://`. */
const URI_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;

/**
 * Last segment of a file path or URI, used as the display name.
 * Handles both Linux (`/`) and Windows (`\`) separators.
 * URIs (e.g. Android `content://…/document%2Freport.pdf`) are percent-encoded,
 * so they are decoded; plain paths are not, since `%` is a valid file name character.
 */
export function getFileName(path: string): string {
  const name = path.split(/[\\/]/).pop() || path;
  return URI_SCHEME.test(path) ? safeDecode(name) : name;
}

/** decodeURIComponent throws on malformed input; fall back to the raw value. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
