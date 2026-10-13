/**
 * The outline module shows the PDF's bookmarks (table of contents) as a tree.
 * Clicking one resolves its destination and reports it; the app does the scrolling.
 */
import type { PageTarget, PdfDocument, PdfOutlineNode } from "@/modules/pdf/pdf.types";

export type OutlineState =
  | { status: "loading" }
  | { status: "ready"; nodes: PdfOutlineNode[] }
  | { status: "error"; error: string };

export interface OutlinePanelProps {
  pdf: PdfDocument;
  onNavigate: (target: PageTarget) => void;
}

export interface OutlineTreeProps {
  nodes: PdfOutlineNode[];
  depth: number;
  onSelect: (node: PdfOutlineNode) => void;
}

export interface OutlineItemProps {
  node: PdfOutlineNode;
  depth: number;
  onSelect: (node: PdfOutlineNode) => void;
}

export interface OutlineMessageProps {
  title: string;
  description?: string;
}
