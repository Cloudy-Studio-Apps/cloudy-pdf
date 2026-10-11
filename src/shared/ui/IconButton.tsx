import { cn } from "@/shared/utils/class-names.utils";
import type { IconButtonProps } from "./ui.types";

/** Square icon-only button used in toolbars and dialogs. `label` becomes the tooltip and aria-label. */
export function IconButton({ icon: Icon, label, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center text-muted transition-colors",
        "hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    >
      <Icon className="size-4" />
    </button>
  );
}
