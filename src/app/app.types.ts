/** Types used only by the app shell (`src/app`). */
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { MenuDefinition } from "@/modules/menu/menu.types";
import type { HomePageProps } from "@/modules/home/home.types";
import type { Tab, TabDirection } from "@/modules/tabs/tabs.types";

/** Actions the shell exposes to menus and shortcuts. */
export interface AppActions {
  openDocument: () => void;
  closeActiveTab: () => void;
  cycleTab: (direction: TabDirection) => void;
  showAbout: () => void;
  /** False on Home/Tools, which can't be closed; disables "Close Tab". */
  canCloseTab: boolean;
}

export interface AppHeaderProps {
  menus: MenuDefinition[];
}

/** Picks what to render inside a tab, based on its kind. */
export interface TabContentProps {
  tab: Tab;
  isActive: boolean;
  /** Everything the Home page needs; built once in App. */
  home: HomePageProps;
}

/** App-wide shortcuts, defined once and reused by the menu labels and the key handlers. */
export interface AppShortcuts {
  open: KeyboardShortcut;
  closeTab: KeyboardShortcut;
  nextTab: KeyboardShortcut;
  previousTab: KeyboardShortcut;
}
