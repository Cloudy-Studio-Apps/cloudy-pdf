/**
 * The system module hands files over to the operating system:
 * reveal a file in the file manager, or open it with another app.
 */

export interface SystemActions {
  /** Opens the file manager with the file selected. */
  reveal: (path: string) => void;
  /** Shows the OS "Open with…" app chooser for the file. */
  openWith: (path: string) => void;
  /** Last failure, if any (e.g. the file was moved). */
  error: string | null;
}
