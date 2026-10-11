/**
 * Root component (the "shell").
 *
 * It owns no business logic: it only wires modules together —
 * tabs (`tabs`), document opening (`document`), recent files (`history`),
 * OS actions like "Open with…" (`system`),
 * the pages shown inside tabs (`home`, `tools`, `viewer`), the menu bar (`menu`)
 * and About (`about`).
 */
import { useCallback, useState } from "react";
import { AboutDialog } from "@/modules/about/components/AboutDialog";
import type { OpenedDocument } from "@/modules/document/document.types";
import { useOpenDocument } from "@/modules/document/hooks/useOpenDocument";
import { useOpenedFiles } from "@/modules/document/hooks/useOpenedFiles";
import { useHistory } from "@/modules/history/hooks/useHistory";
import { useSystemActions } from "@/modules/system/hooks/useSystemActions";
import { toHistoryEntry } from "@/modules/history/history.utils";
import { TabBar } from "@/modules/tabs/components/TabBar";
import { TabPanel } from "@/modules/tabs/components/TabPanel";
import { useTabs } from "@/modules/tabs/hooks/useTabs";
import { HOME_TAB } from "@/modules/tabs/tabs.constants";
import { isClosable } from "@/modules/tabs/tabs.utils";
import { AppHeader } from "./components/AppHeader";
import { TabContent } from "./components/TabContent";
import { useAppMenus } from "./hooks/useAppMenus";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import { useHomePage } from "./hooks/useHomePage";
import { useTabsSession } from "./hooks/useTabsSession";
import type { AppActions } from "./app.types";

export function App() {
  const tabs = useTabs();
  // Brings back the open documents after a reload (e.g. Android resuming the app).
  useTabsSession(tabs);
  const history = useHistory();
  const system = useSystemActions();
  const [isAboutOpen, setAboutOpen] = useState(false);

  // Every successfully read file becomes (or focuses) a tab and moves to the top of Recent.
  const onOpened = useCallback(
    (document: OpenedDocument) => {
      tabs.openDocument(document);
      history.record(toHistoryEntry(document));
    },
    [tabs.openDocument, history.record],
  );

  // Errors are displayed on the Home page, so switch to it when opening fails.
  const onOpenError = useCallback(() => tabs.activate(HOME_TAB.id), [tabs.activate]);

  const opener = useOpenDocument({ onOpened, onError: onOpenError });

  // Opens PDFs handed over by the OS ("Open with…" / default PDF reader).
  useOpenedFiles(opener.openPath);

  // `void` marks the returned promise as intentionally not awaited (fire-and-forget).
  const openDocument = useCallback(() => void opener.openFromDialog(), [opener.openFromDialog]);
  const showAbout = useCallback(() => setAboutOpen(true), []);
  const hideAbout = useCallback(() => setAboutOpen(false), []);

  const actions: AppActions = {
    openDocument,
    closeActiveTab: tabs.closeActive,
    cycleTab: tabs.cycle,
    showAbout,
    canCloseTab: isClosable(tabs.activeTab),
  };
  const menus = useAppMenus(actions);
  useAppShortcuts(actions);
  const home = useHomePage(opener, history, system, openDocument);

  return (
    <div className="flex h-full flex-col">
      <AppHeader menus={menus} />
      <TabBar
        tabs={tabs.tabs}
        activeId={tabs.activeTab.id}
        onActivate={tabs.activate}
        onClose={tabs.close}
      />
      {/* min-h-0 lets this flex child shrink; `relative` anchors the stacked tab panels. */}
      <main className="relative min-h-0 flex-1 bg-canvas">
        {/* All tabs stay mounted (hidden when inactive) so each keeps its scroll and zoom. */}
        {tabs.tabs.map((tab) => {
          const isActive = tab.id === tabs.activeTab.id;
          return (
            <TabPanel key={tab.id} isActive={isActive}>
              <TabContent tab={tab} isActive={isActive} home={home} />
            </TabPanel>
          );
        })}
      </main>
      <AboutDialog open={isAboutOpen} onClose={hideAbout} />
    </div>
  );
}
