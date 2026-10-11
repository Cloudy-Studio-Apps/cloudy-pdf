import { ViewerMessage } from "./ViewerMessage";
import { ViewerCanvas } from "./ViewerCanvas";
import { usePdfDocument } from "../hooks/usePdfDocument";
import type { DocumentViewerProps } from "../viewer.types";

/**
 * Entry point of the viewer module: loads the PDF, then shows a loading
 * message, an error, or the pages.
 *
 * Split from ViewerCanvas on purpose: ViewerCanvas only mounts once the PDF
 * is ready, so its hooks never have to handle a "no document yet" case.
 */
export function DocumentViewer({ document }: DocumentViewerProps) {
  const state = usePdfDocument(document.data);

  if (state.status === "loading") return <ViewerMessage title="Loading document…" />;
  if (state.status === "error") {
    return <ViewerMessage title="This PDF could not be opened" description={state.error} />;
  }
  return <ViewerCanvas pdf={state.pdf} pageSizes={state.pageSizes} />;
}
