import { useEffect, useState } from "react";
import { getOutline } from "@/modules/pdf/services/pdf.service";
import type { PdfDocument } from "@/modules/pdf/pdf.types";
import { getErrorMessage } from "@/shared/utils/error.utils";
import type { OutlineState } from "../outline.types";

/** Loads the document's bookmarks once per document. */
export function useOutline(pdf: PdfDocument): OutlineState {
  const [state, setState] = useState<OutlineState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getOutline(pdf)
      .then((nodes) => active && setState({ status: "ready", nodes }))
      .catch((error) => active && setState({ status: "error", error: getErrorMessage(error) }));
    return () => {
      active = false;
    };
  }, [pdf]);

  return state;
}
