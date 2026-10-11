import { ViewerMessage } from "./ViewerMessage";
import { ViewerCanvas } from "./ViewerCanvas";
import { usePdfDocument } from "../hooks/usePdfDocument";
import type { DocumentViewerProps } from "../viewer.types";

export function DocumentViewer({ document }: DocumentViewerProps) {
  const state = usePdfDocument(document.data);

  if (state.status === "loading") return <ViewerMessage title="Loading document…" />;
  if (state.status === "error") {
    return <ViewerMessage title="This PDF could not be opened" description={state.error} />;
  }
  return <ViewerCanvas pdf={state.pdf} pageSizes={state.pageSizes} />;
}
