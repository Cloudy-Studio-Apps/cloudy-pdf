/**
 * The menu module is data-driven: callers describe menus as plain objects
 * (MenuEntry[]) and the components render them. The same entries work in the
 * menu bar dropdowns and in right-click context menus.
 */
import type { CSSProperties, MouseEvent, Ref } from "react";
import type { IconType } from "react-icons";
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { Point } from "@/shared/hooks/hooks.types";

export interface MenuItemDefinition {
  type?: "item";
  id: string;
  label: string;
  /** Optional leading icon. */
  icon?: IconType;
  /** Only displayed as a hint; the key handler itself is registered by the app. */
  shortcut?: KeyboardShortcut;
  disabled?: boolean;
  /** Destructive action (shown in red), e.g. "Remove from history". */
  danger?: boolean;
  onSelect: () => void;
}

/** A thin divider line between groups of items. */
export interface MenuSeparatorDefinition {
  type: "separator";
  id: string;
}

export type MenuEntry = MenuItemDefinition | MenuSeparatorDefinition;

/** A top-level entry ("File", "Help") with its dropdown entries. */
export interface MenuDefinition {
  id: string;
  label: string;
  items: MenuEntry[];
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

/** The list panel shared by dropdowns and context menus. */
export interface MenuListProps {
  entries: MenuEntry[];
  /** Called after an item is clicked so the owner can close the menu. */
  onSelected: () => void;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLUListElement>;
}

export interface MenuItemProps {
  item: MenuItemDefinition;
  onSelected: () => void;
}

/** Where a context menu opens (viewport coordinates). Same shape as the shared Point. */
export type MenuPosition = Point;

/** An open context menu: where it was opened and on what (e.g. which file). */
export interface ContextMenuState<T> {
  position: MenuPosition;
  target: T;
}

export interface UseContextMenuResult<T> {
  /** null while closed. */
  menu: ContextMenuState<T> | null;
  /** Use as (or inside) an onContextMenu handler (right-click). */
  open: (event: MouseEvent, target: T) => void;
  /** Opens at a given point, e.g. where a long press happened (touch). */
  openAt: (position: MenuPosition, target: T) => void;
  close: () => void;
}

export interface ContextMenuProps {
  position: MenuPosition;
  entries: MenuEntry[];
  onClose: () => void;
}
