import { useMergeTool } from "../../hooks/useMergeTool";
import { FileList } from "../workbench/FileList";
import { ToolRunBar } from "../workbench/ToolRunBar";
import { ToolSection } from "../workbench/ToolSection";
import type { ToolBodyProps } from "../../tools.types";

/** Merge PDF: pick and order the files, then save their merge. */
export function MergeTool(actions: ToolBodyProps) {
  const { files, run, canRun, merge } = useMergeTool();

  return (
    <>
      <ToolSection title="Files" hint="Pages are joined in this order. Bookmarks and form fields aren't kept.">
        <FileList control={files} />
      </ToolSection>
      <ToolRunBar run={run} label="Merge PDFs" canRun={canRun} onRun={merge} {...actions} />
    </>
  );
}
