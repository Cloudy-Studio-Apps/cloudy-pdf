import { useCallback } from "react";
import { pickSavePath } from "@/shared/files/file-dialogs.service";
import { mergePdfs } from "../services/tools.service";
import { outputName } from "../tools.utils";
import { useFileList } from "./useFileList";
import { useToolRun } from "./useToolRun";
import type { MergeTool } from "../tools.types";

/** Merge PDF: the files to join, in order, and the run. */
export function useMergeTool(): MergeTool {
  const run = useToolRun();
  const files = useFileList(run.reset);
  const canRun = files.files.length >= 2 && !run.isRunning;

  const merge = useCallback(() => {
    const inputs = files.files;
    run.run(async () => {
      const output = await pickSavePath(outputName(inputs[0].name, "merged"));
      return output ? mergePdfs(inputs.map((file) => file.path), output) : null;
    });
  }, [files.files, run.run]);

  return { files, run, canRun, merge };
}
