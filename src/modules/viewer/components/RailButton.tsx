import { cn } from "@/shared/utils/class-names.utils";
import type { RailButtonProps } from "../viewer.types";

/**
 * Square icon button of the side rails. Active: accent icon on the hover tone.
 * Unavailable buttons use aria-disabled (not `disabled`) so their "coming soon"
 * tooltip still shows on hover.
 */
export function RailButton({ icon: Icon, label, active = false, unavailable = false, onClick }: RailButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={unavailable ? undefined : active}
      aria-disabled={unavailable || undefined}
      onClick={unavailable ? undefined : onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center text-muted transition-colors",
        "focus-visible:outline-2 focus-visible:outline-accent",
        unavailable ? "cursor-default opacity-35" : "hover:bg-hover hover:text-ink",
        active && "bg-hover text-accent hover:text-accent",
      )}
    >
      <Icon className="size-4.5" />
    </button>
  );
}
