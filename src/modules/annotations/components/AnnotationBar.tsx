import { LuRedo2, LuTrash2, LuUndo2 } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { cn } from "@/shared/utils/class-names.utils";
import { ANNOTATION_ATTRIBUTE, ANNOTATION_SHORTCUTS, INK_COLORS, PENS } from "../annotations.constants";
import type { AnnotationBarProps } from "../annotations.types";
import { SwatchButton } from "./SwatchButton";
import { ThicknessButton } from "./ThicknessButton";

/**
 * Small floating bar over the pages: pen, colour and width (Draw tool), undo /
 * redo, and delete for the selected stroke. The buttons matter on phones, where
 * there's no keyboard for Ctrl+Z or Delete.
 */
export function AnnotationBar({ annotations, showStyle }: AnnotationBarProps) {
  const { style, setStyle, selectedId } = annotations;
  const pen = PENS[style.pen];

  return (
    <div
      role="toolbar"
      aria-label="Drawing"
      // Counts as part of the annotations: pressing its buttons mustn't deselect the stroke first.
      {...{ [ANNOTATION_ATTRIBUTE]: "toolbar" }}
      // Scrolls sideways on narrow phones instead of overflowing the screen.
      className="flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto border border-border bg-surface px-2 py-1 shadow-sm"
    >
      {showStyle && (
        <>
          {Object.values(PENS).map(({ id, label, icon }) => (
            <IconButton
              key={id}
              icon={icon}
              label={label}
              aria-pressed={style.pen === id}
              className={cn("shrink-0", style.pen === id && "bg-hover text-accent hover:text-accent")}
              onClick={() => setStyle({ ...style, pen: id })}
            />
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          {INK_COLORS.map((color) => (
            <SwatchButton
              key={color}
              color={color}
              active={style.color === color}
              onClick={() => setStyle({ ...style, color })}
            />
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
          {pen.thicknesses.map((thickness, size) => (
            <ThicknessButton
              key={size}
              size={size}
              thickness={thickness}
              active={style.size === size}
              onClick={() => setStyle({ ...style, size })}
            />
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-border" />
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
