import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { MenuDefinition } from "@/modules/menu/menu.types";

export interface AppActions {
  openDocument: () => void;
  showAbout: () => void;
}

export interface AppHeaderProps {
  menus: MenuDefinition[];
  documentName?: string;
}

export interface WelcomeScreenProps {
  onOpen: () => void;
  isOpening: boolean;
  error: string | null;
}

export interface AppShortcuts {
  open: KeyboardShortcut;
}
