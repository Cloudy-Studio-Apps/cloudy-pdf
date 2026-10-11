/** Types used only by the app shell (`src/app`). */
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { MenuDefinition } from "@/modules/menu/menu.types";

/** Actions the shell exposes to the menus. */
export interface AppActions {
  openDocument: () => void;
  showAbout: () => void;
}

export interface AppHeaderProps {
  menus: MenuDefinition[];
  /** Name of the open file, shown centered in the header. */
  documentName?: string;
}

export interface WelcomeScreenProps {
  onOpen: () => void;
  isOpening: boolean;
  /** Last error while opening a file, if any. */
  error: string | null;
}

/** App-wide shortcuts, defined once and reused by the menu labels and the key handlers. */
export interface AppShortcuts {
  open: KeyboardShortcut;
}
