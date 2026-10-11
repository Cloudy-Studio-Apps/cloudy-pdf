import { useEffect, useState } from "react";
import { getPageSize, loadPdf } from "@/modules/pdf/services/pdf.service";
import { getErrorMessage } from "@/shared/utils/error.utils";
import type { PdfLoadState } from "../viewer.types";

/**
 * Opens a PDF for rendering and exposes loading / error / ready states for the UI.
 *
 * Only page 1 is measured before the document shows: measuring every page up
 * front makes pdf.js parse the whole page tree (and, with on-demand loading,
 * read most of the file) before anything appears. The other pages start with
 * page 1's size and correct themselves as they render (see usePageSizes).
 */
export function usePdfDocument(path: string): PdfLoadState {
  const [state, setState] = useState<PdfLoadState>({ status: "loading" });

  useEffect(() => {
    // `active` becomes false on cleanup, so a slow load that finishes after the
    // component unmounted (or after a newer file was opened) is ignored.
    let active = true;
    const job = loadPdf(path);
    setState({ status: "loading" });

    job.promise
      .then(async (pdf) => {
        const defaultPageSize = await getPageSize(pdf, 1);
        if (active) setState({ status: "ready", pdf, defaultPageSize });
      })
      .catch((error) => {
        if (active) setState({ status: "error", error: getErrorMessage(error) });
      });

    return () => {
      active = false;
      // Frees the document in the pdf.js worker and the open file in Rust.
      void job.destroy();
    };
  }, [path]);

  return state;
}
