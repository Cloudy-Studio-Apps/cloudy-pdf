/**
 * Root component (the "shell").
 *
 * It owns no business logic: it only wires modules together —
 * document opening (module `document`), the viewer (module `viewer`),
 * the menu bar (module `menu`) and the About dialog (module `about`).
 */
import { useCallback, useState } from "react";
import { AboutDialog } from "@/modules/about/components/AboutDialog";
import { useOpenDocument } from "@/modules/document/hooks/useOpenDocument";
import { useOpenedFiles } from "@/modules/document/hooks/useOpenedFiles";
import { DocumentViewer } from "@/modules/viewer/components/DocumentViewer";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { AppHeader } from "./components/AppHeader";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { useAppMenus } from "./hooks/useAppMenus";
import { APP_SHORTCUTS } from "./app.constants";

export function App() {
  const { document, error, isOpening, openFromDialog, openPath } = useOpenDocument();
  const [isAboutOpen, setAboutOpen] = useState(false);

  // Stable callbacks (useCallback) so menus and shortcuts are not rebuilt on every render.
  // `void` marks the returned promise as intentionally not awaited (fire-and-forget).
  const openDocument = useCallback(() => void openFromDialog(), [openFromDialog]);
  const showAbout = useCallback(() => setAboutOpen(true), []);
  const hideAbout = useCallback(() => setAboutOpen(false), []);

  // Opens PDFs handed over by the OS ("Open with…" / default PDF reader).
  useOpenedFiles(openPath);

  const menus = useAppMenus({ openDocument, showAbout });
  useKeyboardShortcuts([{ shortcut: APP_SHORTCUTS.open, handler: openDocument }]);

  return (
    <div className="flex h-full flex-col">
      <AppHeader menus={menus} documentName={document?.name} />
      {/* min-h-0 lets this flex child shrink, so the viewer scrolls instead of the page. */}
      <main className="min-h-0 flex-1 bg-canvas">
        {document ? (
          // `key` forces a fresh viewer per document, resetting zoom, scroll and page state.
          <DocumentViewer key={document.id} document={document} />
        ) : (
          <WelcomeScreen onOpen={openDocument} isOpening={isOpening} error={error} />
        )}
      </main>
      <AboutDialog open={isAboutOpen} onClose={hideAbout} />
    </div>
  );
}
