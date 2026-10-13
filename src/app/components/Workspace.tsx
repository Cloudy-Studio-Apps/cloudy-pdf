import { useCallback, useEffect, useMemo, useState } from "react";
import { AnnotationsContext } from "@/modules/annotations/annotations.context";
import { AnnotationBar } from "@/modules/annotations/components/AnnotationBar";
import { AnnotationOverlay } from "@/modules/annotations/components/AnnotationOverlay";
import { toPdfStroke } from "@/modules/annotations/ink.utils";
import type { OpenedDocument } from "@/modules/document/document.types";
import { OutlinePanel } from "@/modules/outline/components/OutlinePanel";
import type { PageTarget } from "@/modules/pdf/pdf.types";
import { FindBar } from "@/modules/search/components/FindBar";
import { useDocumentSearch } from "@/modules/search/hooks/useDocumentSearch";
import { useSystemActions } from "@/modules/system/hooks/useSystemActions";
import { ThumbnailsPanel } from "@/modules/thumbnails/components/ThumbnailsPanel";
import { DocToolbar } from "@/modules/viewer/components/DocToolbar";
import { DocumentPropertiesDialog } from "@/modules/viewer/components/DocumentPropertiesDialog";
import { NoticeBar } from "@/modules/viewer/components/NoticeBar";
import { PanelRail } from "@/modules/viewer/components/PanelRail";
import { SidePanel } from "@/modules/viewer/components/SidePanel";
import { ToolsRail } from "@/modules/viewer/components/ToolsRail";
import { ViewerPages } from "@/modules/viewer/components/ViewerPages";
import { useViewerState } from "@/modules/viewer/hooks/useViewerState";
import type { HighlightsByPage, SidePanelId } from "@/modules/viewer/viewer.types";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { DOCUMENT_SHORTCUTS, WIDE_LAYOUT_QUERY } from "../app.constants";
import { buildDocumentMenu } from "../app.menus";
import { useDocumentAnnotations } from "../hooks/useDocumentAnnotations";
import { useDocumentSave } from "../hooks/useDocumentSave";
import { groupHighlights } from "../app.utils";
import type { WorkspaceProps } from "../app.types";

const NO_HIGHLIGHTS: HighlightsByPage = new Map();

/**
 * One document's workspace (Acrobat-style): toolbar, find bar, tools rail, pages,
 * side panel and panel rail. Lives in the app layer because it connects modules
 * that don't know about each other: search results become viewer highlights, and
 * thumbnails / bookmarks drive the viewer's navigation.
 */
export function Workspace({ document, pdf, defaultPageSize, isActive, host }: WorkspaceProps) {
  const viewer = useViewerState({ pdf, defaultPageSize, isActive });
  const search = useDocumentSearch(pdf);
  // Per tab, so a print error shows in this document, not on Home.
  const system = useSystemActions();
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);
  const [panel, setPanel] = useState<SidePanelId | null>(null);
  const [isPropertiesOpen, setPropertiesOpen] = useState(false);
  const { goToPage, showPage } = viewer.navigation;

  // Save / Save as… live in the app's File menu: register them for this tab.
  const { setCommands, onSaved } = host;
  const saved = useCallback((next: OpenedDocument) => onSaved(document.id, next), [onSaved, document.id]);
  const annotations = useDocumentAnnotations(viewer.tool, isActive);
  const { annotations: inks, isModified: annotationsModified, markSaved } = annotations.control;
  const strokes = useMemo(() => inks.map(toPdfStroke), [inks]);
  const saver = useDocumentSave({
    document,
    pdf,
    onSaved: saved,
    annotations: { strokes, isModified: annotationsModified, markSaved },
  });
  const showAnnotationBar = viewer.tool === "draw" || annotations.control.selectedId !== null;
  const { save, saveAs, isModified } = saver;
  useEffect(() => {
    setCommands(document.id, { save, saveAs, isModified });
    return () => setCommands(document.id, null);
  }, [setCommands, document.id, save, saveAs, isModified]);

  // A new current match: make sure its page is on screen; the page then centers the highlight.
  const currentMatch = search.matches[search.currentIndex];
  useEffect(() => {
    if (search.isOpen && currentMatch) showPage(currentMatch.pageNumber);
  }, [search.isOpen, currentMatch, showPage]);

  const highlights = useMemo(
    () => (search.isOpen ? groupHighlights(search.matches, search.currentIndex) : NO_HIGHLIGHTS),
    [search.isOpen, search.matches, search.currentIndex],
  );

  const { print: printFile } = system;
  const print = useCallback(() => printFile(document.path, document.name), [printFile, document.path, document.name]);
  useKeyboardShortcuts(
    isActive
      ? [
          { shortcut: DOCUMENT_SHORTCUTS.find, handler: search.open },
          { shortcut: DOCUMENT_SHORTCUTS.print, handler: print },
        ]
      : [],
  );

  const togglePanel = useCallback((id: SidePanelId) => setPanel((current) => (current === id ? null : id)), []);
  const closePanel = useCallback(() => setPanel(null), []);
  // On phones the panel covers the pages, so picking a destination also closes it.
  const closePanelOnPhone = useCallback(() => !isWide && setPanel(null), [isWide]);
  const selectPage = useCallback(
    (pageNumber: number) => {
      goToPage(pageNumber);
      closePanelOnPhone();
    },
    [goToPage, closePanelOnPhone],
  );
  const navigateTo = useCallback(
    (target: PageTarget) => {
      goToPage(target.pageNumber, target.topRatio);
      closePanelOnPhone();
    },
    [goToPage, closePanelOnPhone],
  );

  const moreEntries = buildDocumentMenu({
    path: document.path,
    isWide,
    tool: viewer.tool,
    onToolChange: viewer.setTool,
    onRotateLeft: viewer.rotation.rotateCounterclockwise,
    onRotateRight: viewer.rotation.rotateClockwise,
    onProperties: () => setPropertiesOpen(true),
    onReveal: system.reveal,
    onOpenWith: system.openWith,
  });

  return (
    <div className="flex h-full flex-col">
      <DocToolbar
        title={document.name}
        zoom={viewer.zoom}
        display={viewer.display}
        onDisplayChange={viewer.setDisplay}
        onRotate={viewer.rotation.rotateClockwise}
        onSearch={search.open}
        searchShortcut={DOCUMENT_SHORTCUTS.find}
        onPrint={print}
        printShortcut={DOCUMENT_SHORTCUTS.print}
        moreEntries={moreEntries}
      />
      {search.isOpen && <FindBar search={search} />}
      {system.error && <NoticeBar message={system.error} onDismiss={system.clearError} />}
      {saver.error && <NoticeBar message={saver.error} onDismiss={saver.clearError} />}

      {/* `relative`: on phones the side panel is positioned over the pages. */}
      <div className="relative flex min-h-0 flex-1">
        <ToolsRail tool={viewer.tool} onToolChange={viewer.setTool} />
        {/* `relative`: the annotation bar floats over the top of the pages. */}
        <div className="relative min-w-0 flex-1 bg-canvas">
          <AnnotationsContext value={annotations.layer}>
            <ViewerPages viewer={viewer} highlights={highlights} pageOverlay={AnnotationOverlay} />
          </AnnotationsContext>
          {showAnnotationBar && (
            <div className="absolute top-2 left-1/2 z-10 -translate-x-1/2">
              <AnnotationBar annotations={annotations.control} showStyle={viewer.tool === "draw"} />
            </div>
          )}
        </div>
        {panel && (
          <SidePanel panel={panel} onClose={closePanel}>
            {panel === "thumbnails" ? (
              <ThumbnailsPanel
                pdf={pdf}
                pageSizes={viewer.pageSizes.sizes}
                rotation={viewer.rotation.rotation}
                currentPage={viewer.navigation.currentPage}
                isActive={isActive}
                onSelect={selectPage}
              />
            ) : (
              <OutlinePanel pdf={pdf} onNavigate={navigateTo} />
            )}
          </SidePanel>
        )}
        <PanelRail active={panel} onToggle={togglePanel} />
      </div>

      <DocumentPropertiesDialog
        open={isPropertiesOpen}
        onClose={() => setPropertiesOpen(false)}
        pdf={pdf}
        document={document}
        pageSize={defaultPageSize}
      />
    </div>
  );
}
