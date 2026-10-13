import { useEffect, useRef } from "react";
import type { TextLayerHandle } from "@/modules/pdf/pdf.types";
import { applyHighlights } from "../viewer.utils";
import type { PageHighlight } from "../viewer.types";

/**
 * Shows search matches in a page's text layer, re-applied whenever the layer is
 * rebuilt (zoom, rotation) or the matches change.
 *
 * The current match is scrolled into view only when it *becomes* current (its id
 * changes): matches keep arriving while a search runs, and re-scrolling on each
 * update would fight the user's own scrolling.
 */
export function useTextHighlights(layer: TextLayerHandle | null, highlights: readonly PageHighlight[]): void {
  const lastScrolledId = useRef<string | null>(null);

  useEffect(() => {
    // No layer yet (page just scrolled in): wait for it, keeping lastScrolledId as is.
    if (!layer) return;
    const currentMark = applyHighlights(layer, highlights);
    const currentId = highlights.find((highlight) => highlight.current)?.id ?? null;
    if (currentMark && currentId !== lastScrolledId.current) {
      currentMark.scrollIntoView({ block: "center", inline: "nearest" });
    }
    lastScrolledId.current = currentId;
  }, [layer, highlights]);
}
