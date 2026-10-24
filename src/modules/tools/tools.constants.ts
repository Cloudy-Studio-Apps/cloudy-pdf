/**
 * The tool catalog, mirroring the tools and categories of iLovePDF.
 * Pure data: the page just renders it, so adding or moving a tool happens here only.
 * Each tool points at its scene: the seal mascot doing that tool's job, and, once
 * implemented, at its `body`: the screen shown in the tool's own tab.
 */
import { lazy } from "react";
import {
  CompressScene,
  OcrScene,
  RepairScene,
} from "./components/scenes/OptimizeScenes";
import {
  ExtractPagesScene,
  MergeScene,
  OrganizeScene,
  RemovePagesScene,
  ScanScene,
  SplitScene,
} from "./components/scenes/OrganizeScenes";
import {
  ExcelToPdfScene,
  HtmlToPdfScene,
  JpgToPdfScene,
  PdfToExcelScene,
  PdfToJpgScene,
  PdfToMarkdownScene,
  PdfToPdfaScene,
  PdfToPowerPointScene,
  PdfToWordScene,
  PowerPointToPdfScene,
  WordToPdfScene,
} from "./components/scenes/ConvertScenes";
import {
  CropScene,
  EditScene,
  FormsScene,
  PageNumbersScene,
  RotateScene,
  WatermarkScene,
} from "./components/scenes/EditScenes";
import {
  CompareScene,
  ProtectScene,
  RedactScene,
  SignScene,
  UnlockScene,
} from "./components/scenes/SecurityScenes";
import { SummarizeScene, TranslateScene } from "./components/scenes/IntelligenceScenes";
import type { SplitMode, ToolCategory } from "./tools.types";

// Tool screens are loaded on first use, so the catalog adds nothing to the startup bundle.
const MergeTool = lazy(() => import("./components/tools/MergeTool").then((m) => ({ default: m.MergeTool })));
const SplitTool = lazy(() => import("./components/tools/SplitTool").then((m) => ({ default: m.SplitTool })));
const ExtractPagesTool = lazy(() =>
  import("./components/tools/SplitTool").then((m) => ({ default: m.ExtractPagesTool })),
);

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "organize",
    title: "Organize PDF",
    color: "#e5322d",
    tools: [
      { id: "merge", name: "Merge PDF", description: "Combine several PDFs into one, in the order you want.", scene: MergeScene, body: MergeTool },
      { id: "split", name: "Split PDF", description: "Separate one page or a whole set into independent PDF files.", scene: SplitScene, body: SplitTool },
      { id: "remove-pages", name: "Remove pages", description: "Delete the pages you don't need from a PDF.", scene: RemovePagesScene },
      { id: "extract-pages", name: "Extract pages", description: "Pull selected pages out into a new PDF.", scene: ExtractPagesScene, body: ExtractPagesTool },
      { id: "organize", name: "Organize PDF", description: "Sort, add or delete pages however you like.", scene: OrganizeScene },
      { id: "scan", name: "Scan to PDF", description: "Capture paper documents with your camera and save them as PDF.", scene: ScanScene },
    ],
  },
  {
    id: "optimize",
    title: "Optimize PDF",
    color: "#16a34a",
    tools: [
      { id: "compress", name: "Compress PDF", description: "Reduce file size while keeping the best possible quality.", scene: CompressScene },
      { id: "repair", name: "Repair PDF", description: "Recover data from a damaged or corrupt PDF.", scene: RepairScene },
      { id: "ocr", name: "OCR PDF", description: "Turn scanned PDFs into searchable, selectable text.", scene: OcrScene },
    ],
  },
  {
    id: "convert-to",
    title: "Convert to PDF",
    color: "#ea580c",
    tools: [
      { id: "jpg-to-pdf", name: "JPG to PDF", description: "Convert images to PDF, adjusting orientation and margins.", scene: JpgToPdfScene },
      { id: "word-to-pdf", name: "Word to PDF", description: "Make DOC and DOCX files easy to read as PDF.", scene: WordToPdfScene },
      { id: "powerpoint-to-pdf", name: "PowerPoint to PDF", description: "Turn PPT and PPTX slideshows into PDF.", scene: PowerPointToPdfScene },
      { id: "excel-to-pdf", name: "Excel to PDF", description: "Make spreadsheets easy to read as PDF.", scene: ExcelToPdfScene },
      { id: "html-to-pdf", name: "HTML to PDF", description: "Save a web page as a PDF from its URL.", scene: HtmlToPdfScene },
    ],
  },
  {
    id: "convert-from",
    title: "Convert from PDF",
    color: "#2563eb",
    tools: [
      { id: "pdf-to-jpg", name: "PDF to JPG", description: "Turn each page into a JPG, or extract the images inside.", scene: PdfToJpgScene },
      { id: "pdf-to-word", name: "PDF to Word", description: "Convert PDFs into editable DOC and DOCX documents.", scene: PdfToWordScene },
      { id: "pdf-to-powerpoint", name: "PDF to PowerPoint", description: "Turn PDFs into editable PPT and PPTX slideshows.", scene: PdfToPowerPointScene },
      { id: "pdf-to-excel", name: "PDF to Excel", description: "Pull tables out of PDFs into spreadsheets.", scene: PdfToExcelScene },
      { id: "pdf-to-pdfa", name: "PDF to PDF/A", description: "Convert to PDF/A, the ISO standard for long-term archiving.", scene: PdfToPdfaScene },
    ],
  },
  {
    id: "edit",
    title: "Edit PDF",
    color: "#9333ea",
    tools: [
      { id: "rotate", name: "Rotate PDF", description: "Rotate pages the way you need them.", scene: RotateScene },
      { id: "page-numbers", name: "Add page numbers", description: "Number pages, choosing position, size and typography.", scene: PageNumbersScene },
      { id: "watermark", name: "Add watermark", description: "Stamp text or an image over your pages.", scene: WatermarkScene },
      { id: "crop", name: "Crop PDF", description: "Trim margins or keep only a selected area.", scene: CropScene },
      { id: "edit", name: "Edit PDF", description: "Add text, images, shapes or freehand annotations.", scene: EditScene },
      { id: "forms", name: "PDF Forms", description: "Create fillable forms, or fill one in yourself.", scene: FormsScene },
    ],
  },
  {
    id: "security",
    title: "PDF Security",
    color: "#0f766e",
    tools: [
      { id: "unlock", name: "Unlock PDF", description: "Remove password protection from a PDF.", scene: UnlockScene },
      { id: "protect", name: "Protect PDF", description: "Encrypt a PDF with a password.", scene: ProtectScene },
      { id: "sign", name: "Sign PDF", description: "Sign documents yourself.", scene: SignScene },
      { id: "redact", name: "Redact PDF", description: "Permanently remove sensitive text and graphics.", scene: RedactScene },
      { id: "compare", name: "Compare PDF", description: "See two versions side by side and spot the changes.", scene: CompareScene },
    ],
  },
  {
    id: "intelligence",
    title: "PDF Intelligence",
    color: "#db2777",
    tools: [
      { id: "summarize", name: "AI Summarizer", description: "Get the key points of a document in seconds.", scene: SummarizeScene },
      { id: "translate", name: "Translate PDF", description: "Translate a PDF while keeping its layout and fonts.", scene: TranslateScene },
      { id: "pdf-to-markdown", name: "PDF to Markdown", description: "Turn PDFs into Markdown files.", scene: PdfToMarkdownScene },
    ],
  },
];

/** Labels of the Split output modes. */
export const SPLIT_MODE_LABELS: Record<SplitMode, { title: string; hint: string }> = {
  extract: { title: "Extract", hint: "The selected pages, in one PDF" },
  "per-range": { title: "Split by range", hint: "One PDF per range, in a folder" },
  "each-page": { title: "Every page", hint: "One PDF per page, in a folder" },
};

// Names shared with the Rust backend (`src-tauri/src/tools/`); keep them in sync.

/** Must match `tool_page_count` in `tools/info.rs`. */
export const TOOL_PAGE_COUNT_COMMAND = "tool_page_count";

/** Must match `tool_merge` in `tools/merge.rs`. */
export const TOOL_MERGE_COMMAND = "tool_merge";

/** Must match `tool_split` in `tools/split.rs`. */
export const TOOL_SPLIT_COMMAND = "tool_split";
