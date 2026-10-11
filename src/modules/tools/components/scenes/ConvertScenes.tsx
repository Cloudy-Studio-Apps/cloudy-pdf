/** Scenes for "Convert to PDF" and "Convert from PDF": same template, different items. */
import { ArchiveBox } from "@/shared/mascot/components/props/ArchiveBox";
import { Board } from "@/shared/mascot/components/props/Board";
import { Doc } from "@/shared/mascot/components/props/Doc";
import { Globe } from "@/shared/mascot/components/props/Globe";
import { Picture } from "@/shared/mascot/components/props/Picture";
import { ConvertScene } from "./ConvertScene";
import type { ToolSceneProps } from "../../tools.types";

// Office files get their usual brand-like colors so they're recognizable at a glance.
const WORD = "#2563eb";
const EXCEL = "#16a34a";
const PDF_RED = "#dc2626";

const pdf = <Doc label="PDF" color={PDF_RED} />;
const word = <Doc label="W" color={WORD} lines={4} />;
const markdown = <Doc label="MD" color="#334155" lines={4} />;

/** A spreadsheet: a page with a green grid. */
const sheet = (
  <Doc label="X" color={EXCEL} lines={0}>
    <g stroke={EXCEL} strokeWidth="0.6" opacity="0.7">
      <path d="M-8 0 H8 M-8 4 H8 M-8 8 H8 M-8 12 H8 M-3 0 V12 M3 0 V12" />
    </g>
  </Doc>
);

export const JpgToPdfScene = (p: ToolSceneProps) => <ConvertScene {...p} from={<Picture />} to={pdf} mood="happy" />;
export const WordToPdfScene = (p: ToolSceneProps) => <ConvertScene {...p} from={word} to={pdf} />;
export const PowerPointToPdfScene = (p: ToolSceneProps) => <ConvertScene {...p} from={<Board />} to={pdf} mood="focused" />;
export const ExcelToPdfScene = (p: ToolSceneProps) => <ConvertScene {...p} from={sheet} to={pdf} />;
export const HtmlToPdfScene = (p: ToolSceneProps) => <ConvertScene {...p} from={<Globe />} to={pdf} mood="happy" />;

export const PdfToJpgScene = (p: ToolSceneProps) => <ConvertScene {...p} from={pdf} to={<Picture />} mood="happy" />;
export const PdfToWordScene = (p: ToolSceneProps) => <ConvertScene {...p} from={pdf} to={word} />;
export const PdfToPowerPointScene = (p: ToolSceneProps) => <ConvertScene {...p} from={pdf} to={<Board />} mood="focused" />;
export const PdfToExcelScene = (p: ToolSceneProps) => <ConvertScene {...p} from={pdf} to={sheet} />;
export const PdfToPdfaScene = (p: ToolSceneProps) => <ConvertScene {...p} from={pdf} to={<ArchiveBox />} />;
export const PdfToMarkdownScene = (p: ToolSceneProps) => <ConvertScene {...p} from={pdf} to={markdown} mood="happy" />;
