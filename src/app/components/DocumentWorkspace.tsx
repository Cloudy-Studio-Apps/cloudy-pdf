import { ViewerMessage } from "@/modules/viewer/components/ViewerMessage";
import { usePdfDocument } from "@/modules/viewer/hooks/usePdfDocument";
import { Workspace } from "./Workspace";
import type { DocumentWorkspaceProps } from "../app.types";

/**
 * A document tab: loads the PDF, then shows the workspace.
 * Split from Workspace on purpose: Workspace only mounts once the PDF is ready,
 * so its hooks never have to handle a "no document yet" case.
 */
export function DocumentWorkspace({ document, isActive, host }: DocumentWorkspaceProps) {
  const state = usePdfDocument(document.path);

  if (state.status === "loading") return <ViewerMessage title="Loading document…" />;
  if (state.status === "error") {
    return <ViewerMessage title="This PDF could not be opened" description={state.error} />;
  }
  return (
    <Workspace
      document={document}
      pdf={state.pdf}
      defaultPageSize={state.defaultPageSize}
      isActive={isActive}
      host={host}
    />
  );
}
