/**
 * The thumbnails module shows small previews of every page in a side panel.
 * It only renders; which page is current and what a click does come from props.
 */
import type { PageSize, PdfDocument } from "@/modules/pdf/pdf.types";
import type { ObserveVisibility } from "@/shared/hooks/hooks.types";

export interface ThumbnailsPanelProps {
  pdf: PdfDocument;
  /** Known page sizes at 100% (from the viewer). */
  pageSizes: PageSize[];
  /** View rotation in degrees, so previews match the pages. */
  rotation: number;
  currentPage: number;
  /** False in background tabs: no rendering. */
  isActive: boolean;
  onSelect: (pageNumber: number) => void;
}

export interface ThumbnailItemProps {
  pdf: PdfDocument;
  pageNumber: number;
  size: PageSize;
  rotation: number;
  isCurrent: boolean;
  isActive: boolean;
  observe: ObserveVisibility | null;
  onSelect: (pageNumber: number) => void;
}
