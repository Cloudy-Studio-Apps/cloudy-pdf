import { useCallback, useState } from "react";
import { pickPdfPaths } from "@/shared/files/file-dialogs.service";
import { moveItem, toInputFiles } from "../tools.utils";
import type { FileListControl, ToolInputFile } from "../tools.types";

/** An ordered list of input PDFs (Merge): add from the dialog, remove, reorder. */
export function useFileList(onChange?: () => void): FileListControl {
  const [files, setFiles] = useState<ToolInputFile[]>([]);

  const update = useCallback(
    (change: (files: ToolInputFile[]) => ToolInputFile[]) => {
      setFiles(change);
      // The last result no longer matches the inputs.
      onChange?.();
    },
    [onChange],
  );

  const add = useCallback(() => {
    void pickPdfPaths().then((paths) => {
      if (paths?.length) update((current) => [...current, ...toInputFiles(paths)]);
    });
  }, [update]);

  const remove = useCallback(
    (id: string) => update((current) => current.filter((file) => file.id !== id)),
    [update],
  );
  const move = useCallback(
    (id: string, offset: -1 | 1) => update((current) => moveItem(current, id, offset)),
    [update],
  );

  return { files, add, remove, move };
}
