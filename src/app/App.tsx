import { useCallback, useState } from "react";
import { AboutDialog } from "@/modules/about/components/AboutDialog";
import { useOpenDocument } from "@/modules/document/hooks/useOpenDocument";
import { DocumentViewer } from "@/modules/viewer/components/DocumentViewer";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { AppHeader } from "./components/AppHeader";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { useAppMenus } from "./hooks/useAppMenus";
import { APP_SHORTCUTS } from "./app.constants";

export function App() {
  const { document, error, isOpening, openFromDialog } = useOpenDocument();
  const [isAboutOpen, setAboutOpen] = useState(false);

  const openDocument = useCallback(() => void openFromDialog(), [openFromDialog]);
  const showAbout = useCallback(() => setAboutOpen(true), []);
  const hideAbout = useCallback(() => setAboutOpen(false), []);

  const menus = useAppMenus({ openDocument, showAbout });
  useKeyboardShortcuts([{ shortcut: APP_SHORTCUTS.open, handler: openDocument }]);

  return (
    <div className="flex h-full flex-col">
      <AppHeader menus={menus} documentName={document?.name} />
      <main className="min-h-0 flex-1 bg-canvas">
        {document ? (
          <DocumentViewer key={document.id} document={document} />
        ) : (
          <WelcomeScreen onOpen={openDocument} isOpening={isOpening} error={error} />
        )}
      </main>
      <AboutDialog open={isAboutOpen} onClose={hideAbout} />
    </div>
  );
}
