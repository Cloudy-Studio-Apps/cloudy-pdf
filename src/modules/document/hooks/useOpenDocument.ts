import { useCallback, useState } from "react";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { pickPdfPath, readDocument } from "../services/document.service";
import type {
  OpenDocumentCallbacks,
  OpenDocumentStatus,
  UseOpenDocumentResult,
} from "../document.types";

const INITIAL_STATUS: OpenDocumentStatus = { isOpening: false, error: null };

/**
 * Reads files and reports them through `onOpened`. Two ways to open:
 * - `openFromDialog`: user picks a file (menu / Ctrl+O / Home button)
 * - `openPath`: a known path, e.g. handed over by the OS
 *
 * It only tracks the opening status; where the document goes (a new tab)
 * is the caller's decision.
 */
export function useOpenDocument({ onOpened, onError }: OpenDocumentCallbacks): UseOpenDocumentResult {
  const [status, setStatus] = useState<OpenDocumentStatus>(INITIAL_STATUS);

  // The single place where a file is read; both entry points end up here.
  const openPath = useCallback(
    async (path: string) => {
      setStatus({ isOpening: true, error: null });
      try {
        const document = await readDocument(path);
        setStatus(INITIAL_STATUS);
        onOpened(document);
      } catch (error) {
        const message = getErrorMessage(error);
        setStatus({ isOpening: false, error: message });
        onError?.(message);
      }
    },
    [onOpened, onError],
  );

  const openFromDialog = useCallback(async () => {
    const path = await pickPdfPath();
    // null = the user closed the dialog; nothing to do.
    if (path) await openPath(path);
  }, [openPath]);

  return { ...status, openFromDialog, openPath };
}
