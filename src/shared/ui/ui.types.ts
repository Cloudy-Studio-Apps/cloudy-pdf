/** Prop types for the shared UI primitives in `shared/ui`. */
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { IconType } from "react-icons";

export type ButtonVariant = "primary" | "ghost";

export type ButtonSize = "md" | "lg";

/** Extends native button attributes, so onClick, disabled, etc. pass straight through. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional leading icon (any react-icons component). */
  icon?: IconType;
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType;
  /** Required: an icon-only button needs text for screen readers and the tooltip. */
  label: string;
}

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes for the card, e.g. a wider width. */
  className?: string;
}
