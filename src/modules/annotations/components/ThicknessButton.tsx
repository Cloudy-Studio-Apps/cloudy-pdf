import { cn } from "@/shared/utils/class-names.utils";
import type { ThicknessButtonProps } from "../annotations.types";

/** A line width choice, previewed as a short line of that width. */
export function ThicknessButton({ thickness, active, onClick }: ThicknessButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Line width ${thickness} pt`}
      aria-pressed={active}
      title={`${thickness} pt`}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center transition-colors",
        "focus-visible:outline-2 focus-visible:outline-accent",
        active ? "bg-hover" : "hover:bg-hover",
      )}
    >
      {/* At least 1px tall, so the finest choice is still visible. */}
      <span className="w-4 bg-ink" style={{ height: Math.max(1, thickness) }} />
    </button>
  );
}
