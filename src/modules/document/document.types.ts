export interface OpenedDocument {
  id: string;
  name: string;
  path: string;
  data: Uint8Array;
}

export interface DocumentState {
  document: OpenedDocument | null;
  error: string | null;
  isOpening: boolean;
}

export interface UseOpenDocumentResult extends DocumentState {
  openFromDialog: () => Promise<void>;
}
