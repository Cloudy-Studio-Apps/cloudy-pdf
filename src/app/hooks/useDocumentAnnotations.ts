import { useMemo } from "react";
import { useAnnotations } from "@/modules/annotations/hooks/useAnnotations";
import type { AnnotationsLayerValue } from "@/modules/annotations/annotations.types";
import type { ViewerTool } from "@/modules/viewer/viewer.types";
import { toAnnotationMode } from "../app.utils";
import type { DocumentAnnotations } from "../app.types";

/**
 * One document's annotations, driven by the viewer's current tool. Also builds
 * the (memoized) value the page overlays read, so they only re-render when the
 * annotations, the selection, the pen or the mode change.
 */
export function useDocumentAnnotations(tool: ViewerTool, isActive: boolean): DocumentAnnotations {
  const mode = toAnnotationMode(tool);
  const control = useAnnotations({ isActive, mode });
  const { annotations, selectedId, style, add, update, select } = control;

  const layer = useMemo<AnnotationsLayerValue>(
    () => ({ annotations, selectedId, style, mode, add, update, select }),
    [annotations, selectedId, style, mode, add, update, select],
  );
  return { control, layer };
}
