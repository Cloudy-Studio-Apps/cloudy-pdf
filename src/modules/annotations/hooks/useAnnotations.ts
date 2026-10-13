import { useCallback, useEffect, useState } from "react";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import {
  ANNOTATION_ATTRIBUTE,
  ANNOTATION_SHORTCUTS,
  DEFAULT_INK_STYLE,
  EMPTY_HISTORY,
} from "../annotations.constants";
import {
  addAnnotation,
  markSaved as markHistorySaved,
  redo as redoHistory,
  removeAnnotation,
  undo as undoHistory,
  updateAnnotation,
} from "../annotations.utils";
import type { AnnotationsControl, InkAnnotation, NewInkAnnotation, UseAnnotationsOptions } from "../annotations.types";

/**
 * One document's annotations: the undo/redo history, the selection, the pen
 * style, and the keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Delete, Escape).
 * All rules live in annotations.utils.
 */
export function useAnnotations({ isActive, mode }: UseAnnotationsOptions): AnnotationsControl {
  const [history, setHistory] = useState(EMPTY_HISTORY);
  const [selected, setSelected] = useState<string | null>(null);
  const [style, setStyle] = useState(DEFAULT_INK_STYLE);

  // Undo can remove the selected stroke; the selection then simply resolves to nothing.
  const selectedId = history.present.some((annotation) => annotation.id === selected) ? selected : null;

  const add = useCallback(
    (annotation: NewInkAnnotation) =>
      setHistory((h) => addAnnotation(h, { ...annotation, id: crypto.randomUUID() })),
    [],
  );
  const update = useCallback((stroke: InkAnnotation) => setHistory((h) => updateAnnotation(h, stroke)), []);
  const remove = useCallback((id: string) => {
    setHistory((h) => removeAnnotation(h, id));
    setSelected(null);
  }, []);
  const undo = useCallback(() => setHistory(undoHistory), []);
  const redo = useCallback(() => setHistory(redoHistory), []);
  const markSaved = useCallback(() => setHistory(markHistorySaved), []);

  // Switching to Draw or Hand drops the selection: it can't be moved there anyway.
  useEffect(() => {
    if (mode !== "select") setSelected(null);
  }, [mode]);

  // A press anywhere but on a stroke deselects, like clicking off a shape in any editor.
  useEffect(() => {
    if (!isActive || !selectedId) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(`[${ANNOTATION_ATTRIBUTE}]`)) setSelected(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isActive, selectedId]);

  const deleteSelected = () => selectedId && remove(selectedId);
  useKeyboardShortcuts(
    isActive
      ? [
          { shortcut: ANNOTATION_SHORTCUTS.undo, handler: undo, notWhileTyping: true },
          { shortcut: ANNOTATION_SHORTCUTS.redo, handler: redo, notWhileTyping: true },
          { shortcut: ANNOTATION_SHORTCUTS.redoAlt, handler: redo, notWhileTyping: true },
          // Only bound with a selection, so Delete / Escape keep their meaning otherwise.
          ...(selectedId
            ? [
                { shortcut: ANNOTATION_SHORTCUTS.delete, handler: deleteSelected },
                { shortcut: ANNOTATION_SHORTCUTS.deleteAlt, handler: deleteSelected },
                { shortcut: ANNOTATION_SHORTCUTS.deselect, handler: () => setSelected(null) },
              ]
            : []),
        ]
      : [],
  );

  return {
    annotations: history.present,
    selectedId,
    select: setSelected,
    style,
    setStyle,
    add,
    update,
    remove,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    isModified: history.present !== history.saved,
    markSaved,
  };
}
