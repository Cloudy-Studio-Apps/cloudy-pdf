import type { MenuEntry, MenuSeparatorDefinition } from "./menu.types";

/** Shorthand for a divider entry: `[open, separator("s1"), remove]`. */
export function separator(id: string): MenuSeparatorDefinition {
  return { type: "separator", id };
}

/** Type guard: lets TypeScript know which kind of entry it's dealing with. */
export function isSeparator(entry: MenuEntry): entry is MenuSeparatorDefinition {
  return entry.type === "separator";
}
