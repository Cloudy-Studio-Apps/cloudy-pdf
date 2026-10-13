import { lazy, Suspense } from "react";
import { HomePage } from "@/modules/home/components/HomePage";
import { ToolsPage } from "@/modules/tools/components/ToolsPage";
import type { TabContentProps } from "../app.types";

// Loaded on first use: the document workspace pulls in pdf.js, most of the bundle,
// which the Home page doesn't need. The app shows sooner, especially on Android.
const DocumentWorkspace = lazy(() =>
  import("./DocumentWorkspace").then((module) => ({ default: module.DocumentWorkspace })),
);

/**
 * Maps a tab to its page. Lives in the app layer because it connects modules
 * (tabs, home, tools, viewer) that don't know about each other.
 */
export function TabContent({ tab, isActive, home, documentHost }: TabContentProps) {
  switch (tab.kind) {
    case "home":
      return <HomePage {...home} />;
    case "tools":
      return <ToolsPage />;
    case "document":
      return (
        <Suspense>
          <DocumentWorkspace document={tab.document} isActive={isActive} host={documentHost} />
        </Suspense>
      );
  }
}
