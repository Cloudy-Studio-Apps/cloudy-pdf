import { Dialog } from "@/shared/ui/Dialog";
import { formatBytes } from "@/shared/utils/format.utils";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { formatPageSize } from "../viewer.utils";
import { PropertyRow } from "./PropertyRow";
import type { DocumentPropertiesDialogProps } from "../viewer.types";

const formatDate = (date: Date | null) => (date ? date.toLocaleString() : null);

/** File and document information (⋯ → Document properties). */
export function DocumentPropertiesDialog({ open, onClose, pdf, document, pageSize }: DocumentPropertiesDialogProps) {
  const metadata = useDocumentMetadata(pdf, open);

  return (
    <Dialog open={open} title="Document properties" onClose={onClose} className="w-[28rem]">
      <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
        <PropertyRow label="File" value={document.name} />
        <PropertyRow label="Location" value={document.path} />
        <PropertyRow label="File size" value={formatBytes(document.size)} />
        <PropertyRow label="Pages" value={String(pdf.numPages)} />
        <PropertyRow label="Page size" value={formatPageSize(pageSize)} />
        <PropertyRow label="Title" value={metadata?.title ?? null} />
        <PropertyRow label="Author" value={metadata?.author ?? null} />
        <PropertyRow label="Subject" value={metadata?.subject ?? null} />
        <PropertyRow label="Application" value={metadata?.creator ?? null} />
        <PropertyRow label="PDF producer" value={metadata?.producer ?? null} />
        <PropertyRow label="PDF version" value={metadata?.pdfVersion ?? null} />
        <PropertyRow label="Created" value={formatDate(metadata?.created ?? null)} />
        <PropertyRow label="Modified" value={formatDate(metadata?.modified ?? null)} />
      </dl>
    </Dialog>
  );
}
