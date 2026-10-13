/**
 * Hands one document's annotations to its page overlays. A context rather than
 * props: pages are memoized viewer components, and threading annotation state
 * through them would re-render every page on each stroke. Only the overlays
 * (which read this) re-render.
 */
import { createContext } from "react";
import type { AnnotationsLayerValue } from "./annotations.types";

export const AnnotationsContext = createContext<AnnotationsLayerValue | null>(null);
