import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";

export interface MenuItemDefinition {
  id: string;
  label: string;
  shortcut?: KeyboardShortcut;
  disabled?: boolean;
  onSelect: () => void;
}

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
  onSelected: () => void;
}
