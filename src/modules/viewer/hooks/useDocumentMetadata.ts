import { useEffect, useState } from "react";
import { getMetadata } from "@/modules/pdf/services/pdf.service";
import type { PdfDocument, PdfMetadata } from "@/modules/pdf/pdf.types";

/** Document information, read the first time it's needed (`enabled`) and then kept. */
export function useDocumentMetadata(pdf: PdfDocument, enabled: boolean): PdfMetadata | null {
  const [metadata, setMetadata] = useState<PdfMetadata | null>(null);

  useEffect(() => {
    if (!enabled || metadata) return;
    let active = true;
    getMetadata(pdf)
      .then((value) => active && setMetadata(value))
      .catch((error) => console.error("Failed to read document properties", error));
    return () => {
      active = false;
    };
  }, [pdf, enabled, metadata]);

  return metadata;
}
