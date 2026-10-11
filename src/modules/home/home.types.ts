import type { MouseEvent } from "react";
import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
import type { Point } from "@/shared/hooks/hooks.types";
import type { HistoryEntry } from "@/modules/history/history.types";

/** Top section (hero): greeting, open action and the mascot. */
export interface WelcomeSectionProps {
  onOpen: () => void;
  isOpening: boolean;
  /** Last error while opening a file, if any. */
  error: string | null;
  /** Shown as a hint; passed in so this module doesn't depend on the app layer. */
  openShortcut: KeyboardShortcut;
}

export interface FocaWatonaProps {
  className?: string;
}

/** What can be done with a recent file (row click and right-click menu). */
export interface RecentFileActions {
  onOpen: (path: string) => void;
  onReveal: (path: string) => void;
  onOpenWith: (path: string) => void;
  onRemove: (path: string) => void;
}

/** "Recent" table. */
export interface RecentFilesProps extends RecentFileActions {
  entries: HistoryEntry[];
  onClear: () => void;
}

export interface RecentFileRowProps {
  entry: HistoryEntry;
  /** True while this row's context menu is open (keeps it highlighted). */
  isMenuOpen: boolean;
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
  /** Right-click. */
  onContextMenu: (event: MouseEvent, entry: HistoryEntry) => void;
  /** Press-and-hold on touch screens; opens the same menu. */
  onLongPress: (point: Point, entry: HistoryEntry) => void;
}

/** Grouped by section, so HomePage just forwards each group to its component. */
export interface HomePageProps {
  welcome: WelcomeSectionProps;
  recent: RecentFilesProps;
}
