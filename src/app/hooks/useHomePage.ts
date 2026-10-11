import { useMemo } from "react";
import type { HistoryControl } from "@/modules/history/history.types";
import type { HomePageProps } from "@/modules/home/home.types";
import type { UseOpenDocumentResult } from "@/modules/document/document.types";
import type { SystemActions } from "@/modules/system/system.types";
import { APP_SHORTCUTS } from "../app.constants";

/**
 * Assembles the Home page props from the document opener, the history and
 * the OS actions. Kept out of App.tsx so the shell stays a short list of wiring steps.
 */
export function useHomePage(
  opener: UseOpenDocumentResult,
  history: HistoryControl,
  system: SystemActions,
  openDocument: () => void,
): HomePageProps {
  const { isOpening, openPath } = opener;
  // One error line on Home, whichever action failed last.
  const error = opener.error ?? system.error;

  return useMemo(
    () => ({
      welcome: { onOpen: openDocument, isOpening, error, openShortcut: APP_SHORTCUTS.open },
      recent: {
        entries: history.entries,
        onOpen: (path: string) => void openPath(path),
        onReveal: system.reveal,
        onOpenWith: system.openWith,
        onRemove: history.remove,
        onClear: history.clear,
      },
    }),
    [
      openDocument,
      isOpening,
      error,
      openPath,
      history.entries,
      history.remove,
      history.clear,
      system.reveal,
      system.openWith,
    ],
  );
}
