import { cn } from "@/shared/utils/class-names.utils";
import type { ButtonProps, ButtonSize, ButtonVariant } from "./ui.types";

/** Visual style per variant; adding a variant is one line here plus the type. */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85",
  ghost: "text-ink hover:bg-hover",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "h-8 px-3",
  lg: "h-11 px-6 text-sm",
};

/** Text button with an optional icon. */
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      // Explicit type: the default "submit" would submit any surrounding form by accident.
      type="button"
      className={cn(
        "inline-flex items-center gap-2 font-medium transition-colors",
        // focus-visible: show the focus ring for keyboard users only, not on mouse clicks.
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        SIZE_CLASSES[size],
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
