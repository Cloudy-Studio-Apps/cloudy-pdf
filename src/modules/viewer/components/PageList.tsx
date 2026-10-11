import { PdfPage } from "./PdfPage";
import type { PageListProps } from "../viewer.types";

export function PageList({ pdf, pageSizes, scale, scrollRoot }: PageListProps) {
  return (
    <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 px-8 pt-8 pb-24">
      {pageSizes.map((size, index) => (
        <PdfPage
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
