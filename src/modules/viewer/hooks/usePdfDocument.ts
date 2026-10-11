import { useEffect, useState } from "react";
import { getPageSizes, loadPdf } from "@/modules/pdf/services/pdf.service";
import { getErrorMessage } from "@/shared/utils/error.utils";
import type { PdfLoadState } from "../viewer.types";

/**
 * Turns raw file bytes into a ready-to-render pdf.js document plus page sizes.
 * Exposes loading / error / ready states for the UI.
 */
export function usePdfDocument(data: Uint8Array): PdfLoadState {
  const [state, setState] = useState<PdfLoadState>({ status: "loading" });

  useEffect(() => {
    // `active` becomes false on cleanup, so a slow load that finishes after the
    // component unmounted (or after a newer file was opened) is ignored.
    let active = true;
    const job = loadPdf(data);
    setState({ status: "loading" });

    job.promise
      .then(async (pdf) => {
        const pageSizes = await getPageSizes(pdf);
        if (active) setState({ status: "ready", pdf, pageSizes });
      })
      .catch((error) => {
        if (active) setState({ status: "error", error: getErrorMessage(error) });
      });

    return () => {
      active = false;
      // Frees the document in the pdf.js worker; without this, every opened file would leak memory.
      void job.destroy();
    };
  }, [data]);

  return state;
}
