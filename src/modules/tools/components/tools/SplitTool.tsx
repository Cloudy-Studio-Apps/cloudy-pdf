import { LuFileText } from "react-icons/lu";
import { Button } from "@/shared/ui/Button";
import { useSplitTool } from "../../hooks/useSplitTool";
import { writesToFolder } from "../../tools.utils";
import { PageRangeInput } from "../workbench/PageRangeInput";
import { SplitModePicker } from "../workbench/SplitModePicker";
import { ToolRunBar } from "../workbench/ToolRunBar";
import { ToolSection } from "../workbench/ToolSection";
import type { ToolBodyProps, SplitToolProps } from "../../tools.types";

/** Split PDF (and Extract pages): pick a PDF, choose pages and how to write them. */
export function SplitTool({ initialMode = "per-range", ...actions }: SplitToolProps) {
  const split = useSplitTool(initialMode);
  const { input } = split;

  return (
    <>
      <ToolSection title="File">
        <div className="flex flex-wrap items-center gap-3">
          {input && (
            <span className="flex min-w-0 items-center gap-2" title={input.path}>
              <LuFileText className="size-4 shrink-0 text-muted" />
              <span className="truncate">{input.name}</span>
              <span className="shrink-0 text-subtle">
                {input.pageCount} {input.pageCount === 1 ? "page" : "pages"}
              </span>
            </span>
          )}
          <Button variant="ghost" className="border border-border" disabled={split.isLoading} onClick={split.pick}>
            {split.isLoading ? "Reading…" : input ? "Choose another" : "Choose a PDF"}
          </Button>
        </div>
        {split.loadError && <p className="text-danger">{split.loadError}</p>}
      </ToolSection>

      {input && (
        <ToolSection title="Output">
          <SplitModePicker modes={split.modes} value={split.mode} onChange={split.setMode} />
          {split.mode !== "each-page" && (
            <PageRangeInput
              value={split.rangesText}
              onChange={split.setRangesText}
              pageCount={input.pageCount}
              error={split.rangesError}
            />
          )}
          {writesToFolder(split.mode) && (
            <p className="text-xs text-muted">Files with the same names in the chosen folder are replaced.</p>
          )}
        </ToolSection>
      )}

      <ToolRunBar
        run={split.run}
        label={writesToFolder(split.mode) ? "Split into a folder" : "Extract pages"}
        canRun={split.canRun}
        onRun={split.split}
        {...actions}
      />
    </>
  );
}

/** Extract pages: Split, starting in "Extract" mode. */
export function ExtractPagesTool(actions: ToolBodyProps) {
  return <SplitTool initialMode="extract" {...actions} />;
}
