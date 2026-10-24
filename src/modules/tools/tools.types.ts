/** Types for the tools module: the Tools tab (catalog) and each tool's own tab. */
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import type { SealMood } from "@/shared/mascot/mascot.types";

/** Every tool illustration takes the category color (for arrows, labels, sparkles). */
export interface ToolSceneProps {
  color: string;
  className?: string;
}

/** One PDF tool of the catalog. */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  /** Illustration: the seal doing this tool's job. */
  scene: ComponentType<ToolSceneProps>;
  /**
   * The tool's screen, loaded on first use. Only implemented tools have one;
   * the others show "Coming soon" in the catalog.
   */
  body?: LazyExoticComponent<ComponentType<ToolBodyProps>>;
}

/** A group of related tools, shown as one section (same grouping as iLovePDF). */
export interface ToolCategory {
  id: string;
  title: string;
  /** Accent color for every tool in the group; tells categories apart at a glance. */
  color: string;
  tools: ToolDefinition[];
}

/** The shared layout of conversion scenes: source item → seal → result item. */
export interface ConvertSceneProps extends ToolSceneProps {
  /** Source item, drawn around (0, 0). */
  from: ReactNode;
  /** Result item, drawn around (0, 0). */
  to: ReactNode;
  mood?: SealMood;
}

/** A tool found in the catalog, with its category's color. */
export interface ToolEntry {
  tool: ToolDefinition;
  color: string;
}

/** What the app gives every tool: where its results can go. */
export interface ToolHostActions {
  /** Opens a result in a document tab. */
  onOpenDocument: (path: string) => void;
  /** Shows a result in the file manager (desktop only). */
  onReveal: (path: string) => void;
}

/** A tool's own tab (`ToolPage`). */
export interface ToolPageProps extends ToolHostActions {
  toolId: string;
}

/** Every tool screen (`ToolDefinition.body`) receives these. */
export type ToolBodyProps = ToolHostActions;

export interface ToolsPageProps {
  onOpenTool: (toolId: string, title: string) => void;
}

export interface ToolCategorySectionProps extends ToolsPageProps {
  category: ToolCategory;
}

export interface ToolCardProps extends ToolsPageProps {
  tool: ToolDefinition;
  color: string;
}

/** Where a tool run is. `done` lists the files written. */
export type ToolRunState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; outputs: string[] }
  | { status: "error"; message: string };

/**
 * A tool's job: asks where to write (a dialog), writes, and returns the files
 * written; null when the user cancelled the dialog.
 */
export type ToolJob = () => Promise<string[] | null>;

/** Returned by useToolRun. */
export interface ToolRun {
  state: ToolRunState;
  isRunning: boolean;
  run: (job: ToolJob) => void;
  /** Back to idle, e.g. when the inputs change. */
  reset: () => void;
}

/** One input file of a tool. */
export interface ToolInputFile {
  /** Unique in the list, so the same file can be added twice (e.g. merged with itself). */
  id: string;
  path: string;
  name: string;
}

/** Returned by useFileList: an ordered list of input files. */
export interface FileListControl {
  files: ToolInputFile[];
  /** Asks for PDFs with the "Open" dialog and appends them. */
  add: () => void;
  remove: (id: string) => void;
  /** Moves a file one place up (-1) or down (1). */
  move: (id: string, offset: -1 | 1) => void;
}

/** First and last page, 1-based and inclusive (sent as-is to Rust). */
export type PageRange = [first: number, last: number];

/** Parsed page ranges, or why the text isn't valid. */
export type PageRangesResult = { ranges: PageRange[] } | { error: string };

/**
 * How Split writes its output:
 * - extract: every selected page into one PDF ("Extract pages")
 * - per-range: one PDF per range, into a folder
 * - each-page: one PDF per page, into a folder
 */
export type SplitMode = "extract" | "per-range" | "each-page";

/** One output file of Split: the pages it keeps and where it goes. */
export interface SplitPart {
  ranges: PageRange[];
  output: string;
}

/** The PDF being split, once its pages are counted. */
export interface SplitInput {
  path: string;
  name: string;
  pageCount: number;
}

/** Returned by useMergeTool. */
export interface MergeTool {
  files: FileListControl;
  run: ToolRun;
  canRun: boolean;
  merge: () => void;
}

/** Returned by useSplitTool. */
export interface SplitTool {
  input: SplitInput | null;
  /** Picks the PDF to split (replacing the current one). */
  pick: () => void;
  isLoading: boolean;
  loadError: string | null;
  mode: SplitMode;
  setMode: (mode: SplitMode) => void;
  /** Modes available here (folder modes need a desktop). */
  modes: SplitMode[];
  rangesText: string;
  setRangesText: (text: string) => void;
  /** Error in the ranges text, shown under the field. */
  rangesError: string | null;
  run: ToolRun;
  canRun: boolean;
  split: () => void;
}

export interface SplitToolProps extends ToolBodyProps {
  /** The mode it starts in: "Extract pages" opens Split in extract mode. */
  initialMode?: SplitMode;
}

export interface ToolSectionProps {
  title: string;
  /** Optional line under the title. */
  hint?: string;
  children: ReactNode;
}

export interface FileListProps {
  control: FileListControl;
}

export interface PageRangeInputProps {
  value: string;
  onChange: (value: string) => void;
  pageCount: number;
  error: string | null;
}

export interface ToolRunBarProps extends ToolHostActions {
  run: ToolRun;
  label: string;
  canRun: boolean;
  onRun: () => void;
}

export interface ToolResultProps extends ToolHostActions {
  state: ToolRunState;
}

export interface SplitModePickerProps {
  modes: SplitMode[];
  value: SplitMode;
  onChange: (mode: SplitMode) => void;
}
