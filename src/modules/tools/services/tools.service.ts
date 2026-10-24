/**
 * The tools' Rust commands (`src-tauri/src/tools/`). Rust reads the inputs and
 * writes the outputs itself; only paths cross the bridge, never file contents.
 */
import { invoke } from "@tauri-apps/api/core";
import { TOOL_MERGE_COMMAND, TOOL_PAGE_COUNT_COMMAND, TOOL_SPLIT_COMMAND } from "../tools.constants";
import type { SplitPart } from "../tools.types";

export function getPageCount(path: string): Promise<number> {
  return invoke<number>(TOOL_PAGE_COUNT_COMMAND, { path });
}

/** Joins `inputs` in order into `output`. Resolves to the files written. */
export function mergePdfs(inputs: string[], output: string): Promise<string[]> {
  return invoke<string[]>(TOOL_MERGE_COMMAND, { inputs, output });
}

/** Writes each part of `input` to its own file. Resolves to the files written. */
export function splitPdf(input: string, parts: SplitPart[]): Promise<string[]> {
  return invoke<string[]>(TOOL_SPLIT_COMMAND, { input, parts });
}
