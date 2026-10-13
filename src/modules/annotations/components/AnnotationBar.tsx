import { LuRedo2, LuTrash2, LuUndo2 } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { ANNOTATION_ATTRIBUTE, ANNOTATION_SHORTCUTS, INK_COLORS, INK_THICKNESSES } from "../annotations.constants";
import type { AnnotationBarProps } from "../annotations.types";
import { SwatchButton } from "./SwatchButton";
import { ThicknessButton } from "./ThicknessButton";

/**
 * Small floating bar over the pages: pen colour and width (Draw tool), undo /
 * redo, and delete for the selected stroke. The buttons matter on phones, where
 * there's no keyboard for Ctrl+Z or Delete.
 */
export function AnnotationBar({ annotations, showStyle }: AnnotationBarProps) {
  const { style, setStyle, selectedId } = annotations;

  return (
    <div
      role="toolbar"
      aria-label="Drawing"
      // Counts as part of the annotations: pressing its buttons mustn't deselect the stroke first.
      {...{ [ANNOTATION_ATTRIBUTE]: "toolbar" }}
      className="flex items-center gap-1 border border-border bg-surface px-2 py-1 shadow-sm"
    >
      {showStyle && (
        <>
          {INK_COLORS.map((color) => (
            <SwatchButton
              key={color}
              color={color}
              active={style.color === color}
              onClick={() => setStyle({ ...style, color })}
            />
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          {INK_THICKNESSES.map((thickness) => (
            <ThicknessButton
              key={thickness}
              thickness={thickness}
              active={style.thickness === thickness}
              onClick={() => setStyle({ ...style, thickness })}
            />
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
        </>
      )}
      <IconButton
        icon={LuUndo2}
        label={`Undo (${formatShortcut(ANNOTATION_SHORTCUTS.undo)})`}
        disabled={!annotations.canUndo}
        onClick={annotations.undo}
      />
      <IconButton
        icon={LuRedo2}
        label={`Redo (${formatShortcut(ANNOTATION_SHORTCUTS.redo)})`}
        disabled={!annotations.canRedo}
        onClick={annotations.redo}
      />
      {selectedId && (
        <IconButton
          icon={LuTrash2}
          label="Delete (Del)"
          className="hover:text-danger"
          onClick={() => annotations.remove(selectedId)}
        />
      )}
    </div>
  );
}
