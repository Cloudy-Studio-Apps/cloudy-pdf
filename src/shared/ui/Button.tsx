import { cn } from "@/shared/utils/class-names.utils";
import type { ButtonProps, ButtonVariant } from "./ui.types";

/** Visual style per variant; adding a variant is one line here plus the type. */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85",
  ghost: "text-ink hover:bg-hover",
};

/** Text button with an optional icon. */
export function Button({ variant = "primary", icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      // Explicit type: the default "submit" would submit any surrounding form by accident.
      type="button"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-md px-3 font-medium transition-colors",
        // focus-visible: show the focus ring for keyboard users only, not on mouse clicks.
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-4" />}
      {children}
    </button>
  );
}
