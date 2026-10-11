import { cn } from "@/shared/utils/class-names.utils";
import type { ButtonProps, ButtonVariant } from "./ui.types";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85",
  ghost: "text-ink hover:bg-hover",
};

export function Button({ variant = "primary", icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-md px-3 font-medium transition-colors",
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
