import { use } from "react";
import { AnnotationsContext } from "../annotations.context";
import type { AnnotationsLayerValue } from "../annotations.types";

/** The annotations of the document a page belongs to (see AnnotationsContext). */
export function useAnnotationsLayer(): AnnotationsLayerValue {
  const value = use(AnnotationsContext);
  if (!value) throw new Error("useAnnotationsLayer must be used inside AnnotationsContext");
  return value;
}
