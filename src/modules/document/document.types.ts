/**
 * The document module is responsible for getting a file's bytes into memory:
 * picking it (dialog), receiving it from the OS ("Open with…") and reading it.
 * It knows nothing about PDF rendering; that's the `pdf` and `viewer` modules.
 */

/** A file that has been read and is ready to be displayed. */
export interface OpenedDocument {
  /** Unique per open, so reopening the same file still resets the viewer. */
  id: string;
  /** Display name (file name only). */
  name: string;
  /** Filesystem path on desktop, `content://` URI on Android. */
  path: string;
  /** Raw file contents. */
  data: Uint8Array;
}

export interface DocumentState {
  document: OpenedDocument | null;
  error: string | null;
  isOpening: boolean;
}

/** Opens a file from a known path/URI. Shared by the dialog flow and the OS flow. */
export type OpenPathHandler = (path: string) => Promise<void>;

export interface UseOpenDocumentResult extends DocumentState {
  openFromDialog: () => Promise<void>;
  openPath: OpenPathHandler;
}
