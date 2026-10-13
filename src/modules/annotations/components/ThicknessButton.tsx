import { cn } from "@/shared/utils/class-names.utils";
import { SIZE_PREVIEWS } from "../annotations.constants";
import type { ThicknessButtonProps } from "../annotations.types";

/** A line width choice (fine / medium / bold of the current pen), previewed as a short line. */
export function ThicknessButton({ size, thickness, active, onClick }: ThicknessButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Line width ${thickness} pt`}
      aria-pressed={active}
      title={`${thickness} pt`}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center transition-colors",
        "focus-visible:outline-2 focus-visible:outline-accent",
        active ? "bg-hover" : "hover:bg-hover",
      )}
    >
      <span className="w-4 bg-ink" style={{ height: SIZE_PREVIEWS[size] }} />
    </button>
  );
}
