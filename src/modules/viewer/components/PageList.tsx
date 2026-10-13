import { NO_PAGE_HIGHLIGHTS } from "../viewer.constants";
import { PdfPage } from "./PdfPage";
import type { PageListProps } from "../viewer.types";

/** The pages: all of them stacked (continuous display), or just one (single page display). */
export function PageList({
  pdf,
  pageSizes,
  scale,
  rotation,
  singlePage,
  isActive,
  observe,
  highlights,
  onPageSize,
}: PageListProps) {
  const pageNumbers = singlePage ? [singlePage] : pageSizes.map((_, index) => index + 1);

  return (
    // w-max + min-w-full: when zoomed in, pages wider than the window make the list grow,
    // so horizontal scrolling works; when zoomed out, pages stay centered.
    // pb-24 leaves room so the last page isn't hidden behind the floating toolbar.
    <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 px-8 pt-8 pb-24">
      {pageNumbers.map((pageNumber) => (
        <PdfPage
          // Page order never changes within a document, so the page number is a stable key.
          key={pageNumber}
          pdf={pdf}
          pageNumber={pageNumber}
          size={pageSizes[pageNumber - 1]}
          scale={scale}
          rotation={rotation}
          isActive={isActive}
          observe={observe}
          highlights={highlights.get(pageNumber) ?? NO_PAGE_HIGHLIGHTS}
          onPageSize={onPageSize}
        />
      ))}
    </div>
  );
}
