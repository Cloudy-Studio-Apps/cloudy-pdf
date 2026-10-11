import { useCallback, useState } from "react";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { pickPdfPath, readDocument } from "../services/document.service";
import type { DocumentState, UseOpenDocumentResult } from "../document.types";

const INITIAL_STATE: DocumentState = { document: null, error: null, isOpening: false };

/**
 * Holds the currently open document and exposes the two ways to open one:
 * - `openFromDialog`: user picks a file (menu / Ctrl+O / welcome button)
 * - `openPath`: a known path, e.g. handed over by the OS
 */
export function useOpenDocument(): UseOpenDocumentResult {
  const [state, setState] = useState<DocumentState>(INITIAL_STATE);

  // The single place where a file is read; both entry points end up here.
  const openPath = useCallback(async (path: string) => {
    // Keep the current document visible while the new one loads.
    setState((current) => ({ ...current, error: null, isOpening: true }));
    try {
      const document = await readDocument(path);
      setState({ document, error: null, isOpening: false });
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error), isOpening: false }));
    }
  }, []);

  const openFromDialog = useCallback(async () => {
    const path = await pickPdfPath();
    // null = the user closed the dialog; nothing to do.
    if (path) await openPath(path);
  }, [openPath]);

  return { ...state, openFromDialog, openPath };
}
