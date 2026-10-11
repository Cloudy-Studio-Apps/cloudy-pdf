import type { KeyboardShortcut } from "@/shared/keyboard/keyboard.types";
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

/** "Recent" table. */
export interface RecentFilesProps {
  entries: HistoryEntry[];
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
  onClear: () => void;
}

export interface RecentFileRowProps {
  entry: HistoryEntry;
  onOpen: (path: string) => void;
  onRemove: (path: string) => void;
}

/** Grouped by section, so HomePage just forwards each group to its component. */
export interface HomePageProps {
  welcome: WelcomeSectionProps;
  recent: RecentFilesProps;
}
