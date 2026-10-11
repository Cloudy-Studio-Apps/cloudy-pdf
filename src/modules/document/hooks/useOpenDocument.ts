import { useCallback, useState } from "react";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { pickPdfPath, readDocument } from "../services/document.service";
import type { DocumentState, UseOpenDocumentResult } from "../document.types";

const INITIAL_STATE: DocumentState = { document: null, error: null, isOpening: false };

export function useOpenDocument(): UseOpenDocumentResult {
  const [state, setState] = useState<DocumentState>(INITIAL_STATE);

  const openFromDialog = useCallback(async () => {
    const path = await pickPdfPath();
    if (!path) return;

    setState((current) => ({ ...current, error: null, isOpening: true }));
    try {
      const document = await readDocument(path);
      setState({ document, error: null, isOpening: false });
    } catch (error) {
      setState((current) => ({ ...current, error: getErrorMessage(error), isOpening: false }));
    }
  }, []);

  return { ...state, openFromDialog };
}
