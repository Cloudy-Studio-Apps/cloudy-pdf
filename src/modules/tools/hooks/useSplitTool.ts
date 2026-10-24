import { useCallback, useMemo, useState } from "react";
import { pickFolder, pickPdfPath, pickSavePath } from "@/shared/files/file-dialogs.service";
import { getErrorMessage } from "@/shared/utils/error.utils";
import { getFileName } from "@/shared/utils/path.utils";
import { isDesktop } from "@/shared/utils/platform.utils";
import { getPageCount, splitPdf } from "../services/tools.service";
import { formatPageRanges, outputName, parsePageRanges, splitParts, writesToFolder } from "../tools.utils";
import { useToolRun } from "./useToolRun";
import type { SplitInput, SplitMode, SplitTool } from "../tools.types";

// Android's dialog can't pick a folder, so only "Extract" (one file) is offered there.
const MODES: SplitMode[] = isDesktop ? ["extract", "per-range", "each-page"] : ["extract"];

/** Split / Extract pages: the input PDF, which pages, how to write them, and the run. */
export function useSplitTool(initialMode: SplitMode): SplitTool {
  const run = useToolRun();
  const [input, setInput] = useState<SplitInput | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setModeState] = useState<SplitMode>(MODES.includes(initialMode) ? initialMode : "extract");
  const [rangesText, setRangesTextState] = useState("");

  // Any change of the inputs makes the last result stale.
  const setMode = useCallback(
    (next: SplitMode) => {
      setModeState(next);
      run.reset();
    },
    [run.reset],
  );
  const setRangesText = useCallback(
    (next: string) => {
      setRangesTextState(next);
      run.reset();
    },
    [run.reset],
  );

  const pick = useCallback(async () => {
    const path = await pickPdfPath();
    if (!path) return;
    setLoading(true);
    setLoadError(null);
    run.reset();
    try {
      // Counted by Rust (lopdf): that's also a check that the tool can read the file.
      const pageCount = await getPageCount(path);
      setInput({ path, name: getFileName(path), pageCount });
    } catch (error) {
      setInput(null);
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [run.reset]);

  // "Every page" doesn't use the ranges, so they can't block it.
  const parsed = useMemo(
    () => (input && mode !== "each-page" ? parsePageRanges(rangesText, input.pageCount) : null),
    [input, mode, rangesText],
  );
  const ranges = useMemo(() => (parsed && "ranges" in parsed ? parsed.ranges : []), [parsed]);
  // No error before the user typed anything: the placeholder already explains.
  const rangesError = parsed && "error" in parsed && rangesText.trim() ? parsed.error : null;
  const canRun = Boolean(input) && !run.isRunning && (mode === "each-page" || ranges.length > 0);

  const split = useCallback(() => {
    if (!input) return;
    run.run(async () => {
      if (!writesToFolder(mode)) {
        const output = await pickSavePath(outputName(input.name, `pages-${formatPageRanges(ranges)}`));
        return output ? splitPdf(input.path, [{ ranges, output }]) : null;
      }
      const folder = await pickFolder();
      return folder ? splitPdf(input.path, splitParts(mode, ranges, input.pageCount, input.name, folder)) : null;
    });
  }, [input, mode, ranges, run.run]);

  return {
    input,
    pick: () => void pick(),
    isLoading,
    loadError,
    mode,
    setMode,
    modes: MODES,
    rangesText,
    setRangesText,
    rangesError,
    run,
    canRun,
    split,
  };
}
