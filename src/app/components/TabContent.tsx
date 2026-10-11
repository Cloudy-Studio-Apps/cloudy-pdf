import { HomePage } from "@/modules/home/components/HomePage";
import { ToolsPage } from "@/modules/tools/components/ToolsPage";
import { DocumentViewer } from "@/modules/viewer/components/DocumentViewer";
import type { TabContentProps } from "../app.types";

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
      return <DocumentViewer document={tab.document} isActive={isActive} />;
  }
}
