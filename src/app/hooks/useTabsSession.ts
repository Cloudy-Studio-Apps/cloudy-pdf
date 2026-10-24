import { useEffect, useRef } from "react";
import { readDocument } from "@/modules/document/services/document.service";
import { loadTabsSession, saveTabsSession } from "@/modules/tabs/services/tabs-session.service";
import { createToolTab, toTabsSession } from "@/modules/tabs/tabs.utils";
import { findTool } from "@/modules/tools/tools.utils";
import type { OpenedDocument } from "@/modules/document/document.types";
import type { TabsControl, ToolTab } from "@/modules/tabs/tabs.types";

/** Re-reads files; ones that were deleted or are no longer readable are skipped. */
async function readAll(paths: string[]): Promise<OpenedDocument[]> {
  const results = await Promise.allSettled(paths.map(readDocument));
  return results
    .filter((result): result is PromiseFulfilledResult<OpenedDocument> => result.status === "fulfilled")
    .map((result) => result.value);
}

/** Tool tabs of a session; tools that no longer exist are skipped. */
function toolTabs(toolIds: string[]): ToolTab[] {
  return toolIds.flatMap((toolId) => {
    const entry = findTool(toolId);
    return entry ? [createToolTab(toolId, entry.tool.name)] : [];
  });
}

/**
 * Restores the open document and tool tabs after a page reload, then keeps the saved
 * session up to date. Lives in the app layer because it connects two modules:
 * tabs (what's open), document (re-reading the files) and tools (their names).
 *
 * Restored files are not recorded in Recent again: they weren't opened by the
 * user just now, so Recent's order shouldn't change.
 */
export function useTabsSession({ tabs, activeTab, restore }: TabsControl): void {
  // Don't save until the old session has been read back, or the initial empty
  // tab list would overwrite it (same idea as the history "loaded" flag).
  const restored = useRef(false);

  useEffect(() => {
    // Cancelled on cleanup, so StrictMode's double mount in dev restores only once.
    let cancelled = false;
    const session = loadTabsSession();

    const reopen = async () => {
      const documents = session ? await readAll(session.documents) : [];
      if (cancelled) return;
      // Flag first, so the update below is the first one that gets saved.
      restored.current = true;
      const tools = session ? toolTabs(session.tools) : [];
      if (session && documents.length + tools.length > 0) restore(documents, tools, session.active);
    };

    void reopen();
    return () => {
      cancelled = true;
    };
  }, [restore]);

  useEffect(() => {
    if (restored.current) saveTabsSession(toTabsSession(tabs, activeTab));
  }, [tabs, activeTab]);
}
