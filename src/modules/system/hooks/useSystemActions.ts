import { useCallback, useState } from "react";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { openWithChooser, printDocument, revealInFileManager } from "../services/system.service";
import type { SystemActions } from "../system.types";

/** Fire-and-forget OS actions, with the last error kept for display. */
export function useSystemActions(): SystemActions {
  const [error, setError] = useState<string | null>(null);

  // Wraps a service call: clears the previous error, records a new one if it fails.
  const run = useCallback((action: () => Promise<void>) => {
    setError(null);
    action().catch((reason) => setError(getErrorMessage(reason)));
  }, []);

  const reveal = useCallback((path: string) => run(() => revealInFileManager(path)), [run]);
  const openWith = useCallback((path: string) => run(() => openWithChooser(path)), [run]);
  const print = useCallback((path: string, title: string) => run(() => printDocument(path, title)), [run]);
  const clearError = useCallback(() => setError(null), []);

  return { reveal, openWith, print, error, clearError };
}
