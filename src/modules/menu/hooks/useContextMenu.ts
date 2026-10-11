import { useCallback, useState, type MouseEvent } from "react";
import type { ContextMenuState, MenuPosition, UseContextMenuResult } from "../menu.types";

/**
 * State for a context menu: where to show it and what it was opened on.
 * Generic over the target, e.g. useContextMenu<HistoryEntry>() for the Recent list.
 * Opened by right-click (`open`) or by a long press on touch screens (`openAt`).
 */
export function useContextMenu<T>(): UseContextMenuResult<T> {
  const [menu, setMenu] = useState<ContextMenuState<T> | null>(null);

  const openAt = useCallback((position: MenuPosition, target: T) => {
    setMenu({ position, target });
  }, []);

  const open = useCallback(
    (event: MouseEvent, target: T) => {
      // Replace the webview's own right-click menu (Reload, Inspect…) with ours.
      event.preventDefault();
      openAt({ x: event.clientX, y: event.clientY }, target);
    },
    [openAt],
  );

  const close = useCallback(() => setMenu(null), []);

  return { menu, open, openAt, close };
}
