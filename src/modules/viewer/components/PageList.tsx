import { PdfPage } from "./PdfPage";
import type { PageListProps } from "../viewer.types";

/** All pages stacked vertically (continuous scroll). */
export function PageList({ pdf, pageSizes, scale, scrollRoot }: PageListProps) {
  return (
    // w-max + min-w-full: when zoomed in, pages wider than the window make the list grow,
    // so horizontal scrolling works; when zoomed out, pages stay centered.
    // pb-24 leaves room so the last page isn't hidden behind the floating toolbar.
    <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 px-8 pt-8 pb-24">
      {pageSizes.map((size, index) => (
        <PdfPage
          // Page order never changes within a document, so the page number is a stable key.
          key={index + 1}
          pdf={pdf}
          pageNumber={index + 1}
          size={size}
          scale={scale}
          scrollRoot={scrollRoot}
        />
      ))}
    </div>
  );
}
