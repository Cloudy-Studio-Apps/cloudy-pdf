/**
 * Joins CSS class names, skipping falsy values.
 * Lets components write conditional classes inline:
 *   cn("base", isOpen && "bg-hover", className)
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
