import { useEffect } from "react";
import { onFilesPending, takePendingFiles } from "../services/opened-files.service";
import type { OpenPathHandler } from "../document.types";

/**
 * Opens files handed over by the OS, both at launch and while the app is running.
 *
 * Order matters: start listening first, then take the queue once. That covers
 * files that arrived before mount (already queued) and after (signal received).
 */
export function useOpenedFiles(openPath: OpenPathHandler): void {
  useEffect(() => {
    // Not cancelled on cleanup: draining the queue is one-shot, so its result must be used.
    // (React StrictMode mounts twice in dev; ignoring the first result would lose the file.)
    const openLatest = () =>
      takePendingFiles().then((files) => {
        // This viewer shows one document, so if several arrived, open the most recent.
        const latest = files.at(-1);
        if (latest) void openPath(latest);
      });

    const unlisten = onFilesPending(openLatest);
    void unlisten.then(openLatest);

    // `listen` is async, so unsubscribing has to wait for it to resolve.
    return () => void unlisten.then((stop) => stop());
  }, [openPath]);
}
