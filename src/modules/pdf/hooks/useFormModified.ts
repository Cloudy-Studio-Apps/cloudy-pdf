import { useEffect, useState } from "react";
import { watchFormChanges } from "../services/pdf.service";
import type { PdfDocument } from "../pdf.types";

/** True once a form field was edited, until the document is saved (markSaved). */
export function useFormModified(pdf: PdfDocument): boolean {
  const [isModified, setModified] = useState(false);
  useEffect(() => {
    setModified(false);
    return watchFormChanges(pdf, setModified);
  }, [pdf]);
  return isModified;
}
