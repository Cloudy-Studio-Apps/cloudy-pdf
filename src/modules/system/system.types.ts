/**
 * The system module hands files over to the operating system:
 * reveal a file in the file manager, open it with another app, or print it.
 */

export interface SystemActions {
  /** Opens the file manager with the file selected. */
  reveal: (path: string) => void;
  /** Shows the OS "Open with…" app chooser for the file. */
  openWith: (path: string) => void;
  /** Shows the system print dialog for the original file; `title` names the job. */
  print: (path: string, title: string) => void;
  /** Last failure, if any (e.g. the file was moved). */
  error: string | null;
  clearError: () => void;
}
