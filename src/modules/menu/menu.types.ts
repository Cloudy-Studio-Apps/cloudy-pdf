/**
 * The menu module is data-driven: the app describes menus as plain objects
 * (MenuDefinition) and MenuBar renders them. Adding a menu entry never
 * requires touching the menu components.
 */
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";

export interface MenuItemDefinition {
  id: string;
  label: string;
  /** Only displayed as a hint; the key handler itself is registered by the app. */
  shortcut?: KeyboardShortcut;
  disabled?: boolean;
  onSelect: () => void;
}

/** A top-level entry ("File", "Help") with its dropdown items. */
export interface MenuDefinition {
  id: string;
  label: string;
  items: MenuItemDefinition[];
}

export interface MenuBarProps {
  menus: MenuDefinition[];
}

export interface MenuProps {
  menu: MenuDefinition;
  isOpen: boolean;
  onToggle: (menuId: string) => void;
  onHover: (menuId: string) => void;
  onClose: () => void;
}

export interface MenuItemProps {
  item: MenuItemDefinition;
  /** Called after a click so the parent can close the dropdown. */
  onSelected: () => void;
}
