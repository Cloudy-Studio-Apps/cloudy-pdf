import { useCallback, useMemo, useState } from "react";
import type { DocumentCommands, DocumentCommandsRegistry, DocumentHost } from "../app.types";

/**
 * Where loaded document tabs register their Save / Save as commands, so the
 * File menu and Ctrl+S can reach the active one. Keyed by tab id rather than
 * "the active document", so the order in which tabs register and unregister
 * when switching doesn't matter.
 */
export function useDocumentCommands(onSaved: DocumentHost["onSaved"]): DocumentCommandsRegistry {
  const [commands, setCommandsMap] = useState<ReadonlyMap<string, DocumentCommands>>(new Map());

  const setCommands = useCallback((tabId: string, next: DocumentCommands | null) => {
    setCommandsMap((current) => {
      const map = new Map(current);
      if (next) map.set(tabId, next);
      else map.delete(tabId);
      return map;
    });
  }, []);

  const host = useMemo<DocumentHost>(() => ({ setCommands, onSaved }), [setCommands, onSaved]);
  const get = useCallback((tabId: string) => commands.get(tabId), [commands]);

  return { host, get };
}
