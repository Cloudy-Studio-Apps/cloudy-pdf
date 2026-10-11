import { useEffect, useState } from "react";
import { getPageSizes, loadPdf } from "@/modules/pdf/services/pdf.service";
import { getErrorMessage } from "@/shared/utils/error.utils";
import type { PdfLoadState } from "../viewer.types";

export function usePdfDocument(data: Uint8Array): PdfLoadState {
  const [state, setState] = useState<PdfLoadState>({ status: "loading" });

  useEffect(() => {
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
      void job.destroy();
    };
  }, [data]);

  return state;
}
