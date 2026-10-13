import { useCallback, useRef, useState } from "react";
import { pickSavePath, writeDocument } from "@/modules/document/services/document.service";
import { useFormModified } from "@/modules/pdf/hooks/useFormModified";
import { exportPdf, markSaved, setInkAnnotations } from "@/modules/pdf/services/pdf.service";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { getFileName } from "@/shared/utils/path.utils";
import type { DocumentSave, UseDocumentSaveOptions } from "../app.types";

/**
 * "Save" and "Save as…" for one document: pdf.js produces the bytes with the
 * filled form fields and the drawn strokes, Rust writes them. Lives in the app layer because it joins
 * the pdf module (export) and the document module (dialog, writing).
 */
export function useDocumentSave({ document, pdf, onSaved, annotations }: UseDocumentSaveOptions): DocumentSave {
  const isModified = useFormModified(pdf) || annotations.isModified;
  const { strokes, markSaved: markAnnotationsSaved } = annotations;
  const [error, setError] = useState<string | null>(null);
  // A ref, not state: a second Ctrl+S in the same tick must already see it.
  const isSaving = useRef(false);

  const saveTo = useCallback(
    async (path: string) => {
      await setInkAnnotations(pdf, strokes);
      const size = await writeDocument(path, await exportPdf(pdf));
      markSaved(pdf);
      markAnnotationsSaved();
      onSaved({ ...document, path, name: getFileName(path), size });
    },
    [pdf, strokes, document, onSaved, markAnnotationsSaved],
  );

  const run = useCallback((action: () => Promise<void>) => {
    if (isSaving.current) return;
    isSaving.current = true;
    setError(null);
    action()
      .catch((reason) => setError(`Couldn't save: ${getErrorMessage(reason)}`))
      .finally(() => {
        isSaving.current = false;
      });
  }, []);

  const save = useCallback(() => {
    if (isModified) run(() => saveTo(document.path));
  }, [isModified, run, saveTo, document.path]);

  const saveAs = useCallback(
    () =>
      run(async () => {
        const path = await pickSavePath(document.name);
        if (path) await saveTo(path);
      }),
    [run, saveTo, document.name],
  );

  const clearError = useCallback(() => setError(null), []);

  return { save, saveAs, isModified, error, clearError };
}
