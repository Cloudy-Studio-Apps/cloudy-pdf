import { lazy, Suspense } from "react";
import { HomePage } from "@/modules/home/components/HomePage";
import { ToolsPage } from "@/modules/tools/components/ToolsPage";
import type { TabContentProps } from "../app.types";

// Loaded on first use: the viewer pulls in pdf.js, most of the bundle, which the
// Home page doesn't need. The app shows sooner, especially on Android.
const DocumentViewer = lazy(() =>
  import("@/modules/viewer/components/DocumentViewer").then((module) => ({ default: module.DocumentViewer })),
);

/**
 * Maps a tab to its page. Lives in the app layer because it connects modules
 * (tabs, home, tools, viewer) that don't know about each other.
 */
export function TabContent({ tab, isActive, home }: TabContentProps) {
  switch (tab.kind) {
    case "home":
      return <HomePage {...home} />;
    case "tools":
      return <ToolsPage />;
    case "document":
      return (
        <Suspense>
          <DocumentViewer document={tab.document} isActive={isActive} />
        </Suspense>
      );
  }
}
