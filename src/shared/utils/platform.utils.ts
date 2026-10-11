/**
 * True on desktop (Linux, Windows, macOS). Some features only exist there,
 * e.g. "Show in file manager", since Android has no file manager to reveal a file in.
 */
export const isDesktop = !/Android|iPhone|iPad/i.test(navigator.userAgent);
