import { cn } from "@/shared/utils/class-names.utils";
import type { SwatchButtonProps } from "../annotations.types";

/** A pen colour choice. The colour is data, so it's set inline rather than as a token. */
export function SwatchButton({ color, active, onClick }: SwatchButtonProps) {
  return (
    <button
      type="button"
      aria-label={`Colour ${color}`}
      aria-pressed={active}
      title={color}
      onClick={onClick}
      className={cn(
        "size-5 shrink-0 ring-offset-1 ring-offset-surface focus-visible:outline-2 focus-visible:outline-accent",
        active ? "ring-2 ring-accent" : "ring-1 ring-border hover:ring-ink/40",
      )}
      style={{ backgroundColor: color }}
    />
  );
}
