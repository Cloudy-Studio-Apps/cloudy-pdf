import { useCallback } from "react";
import { resolveDestination } from "@/modules/pdf/services/pdf.service";
import type { PdfOutlineNode } from "@/modules/pdf/pdf.types";
import { useOutline } from "../hooks/useOutline";
import { OutlineMessage } from "./OutlineMessage";
import { OutlineTree } from "./OutlineTree";
import type { OutlinePanelProps } from "../outline.types";

/** Bookmarks panel: the outline tree, or a message when there's nothing to show. */
export function OutlinePanel({ pdf, onNavigate }: OutlinePanelProps) {
  const state = useOutline(pdf);

  const select = useCallback(
    (node: PdfOutlineNode) => {
      if (!node.dest) return;
      resolveDestination(pdf, node.dest)
        .then((target) => target && onNavigate(target))
        .catch((error) => console.error("Failed to open bookmark", error));
    },
    [pdf, onNavigate],
  );

  if (state.status === "loading") return <OutlineMessage title="Loading bookmarks…" />;
  if (state.status === "error") return <OutlineMessage title="Bookmarks could not be read" description={state.error} />;
  if (state.nodes.length === 0) {
    return <OutlineMessage title="No bookmarks" description="This document has no table of contents." />;
  }
  return (
    <div className="h-full overflow-y-auto py-1">
      <OutlineTree nodes={state.nodes} depth={0} onSelect={select} />
    </div>
  );
}
