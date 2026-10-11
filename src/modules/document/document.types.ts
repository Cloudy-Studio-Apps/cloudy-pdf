/**
 * The document module is responsible for getting hold of a file: picking it
 * (dialog), receiving it from the OS ("Open with…") and checking it can be read.
 * The bytes themselves are read later, on demand, by the `pdf` module.
 * It knows nothing about PDF rendering (`pdf`, `viewer`) or where the document
 * is shown (`tabs`); it just hands each opened file to a callback.
 */

/** A file that was checked to be readable and is ready to be displayed. */
export interface OpenedDocument {
  /** Unique per open; also used as the tab id. */
  id: string;
  /** Display name (file name only). */
  name: string;
  /** Filesystem path on desktop, `content://` URI on Android. Used to detect duplicates. */
  path: string;
  /** File size in bytes. */
  size: number;
}

/** Returned by the Rust `document_info` command. */
export interface DocumentInfo {
  size: number;
}

/** What to do once a file has been read (or failed to). */
export interface OpenDocumentCallbacks {
  onOpened: (document: OpenedDocument) => void;
  onError?: (message: string) => void;
}

export interface OpenDocumentStatus {
  isOpening: boolean;
  /** Last error while opening a file, if any. */
  error: string | null;
}

/** Opens a file from a known path/URI. Shared by the dialog flow and the OS flow. */
export type OpenPathHandler = (path: string) => Promise<void>;

export interface UseOpenDocumentResult extends OpenDocumentStatus {
  openFromDialog: () => Promise<void>;
  openPath: OpenPathHandler;
}
