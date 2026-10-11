import { useMemo } from "react";
import type { HistoryControl } from "@/modules/history/history.types";
import type { HomePageProps } from "@/modules/home/home.types";
import type { UseOpenDocumentResult } from "@/modules/document/document.types";
import { APP_SHORTCUTS } from "../app.constants";

/**
 * Assembles the Home page props from the document opener and the history.
 * Kept out of App.tsx so the shell stays a short list of wiring steps.
 */
export function useHomePage(
  opener: UseOpenDocumentResult,
  history: HistoryControl,
  openDocument: () => void,
): HomePageProps {
  const { isOpening, error, openPath } = opener;

  return useMemo(
    () => ({
      welcome: { onOpen: openDocument, isOpening, error, openShortcut: APP_SHORTCUTS.open },
      recent: {
        entries: history.entries,
        onOpen: (path: string) => void openPath(path),
        onRemove: history.remove,
        onClear: history.clear,
      },
    }),
    [openDocument, isOpening, error, openPath, history.entries, history.remove, history.clear],
  );
}
