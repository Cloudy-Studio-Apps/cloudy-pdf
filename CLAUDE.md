# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

PDF Tormentosa is a minimalist PDF reader: Tauri 2 (Rust) + React 19 + TypeScript + Tailwind CSS 4 + pdf.js (`pdfjs-dist` v6). Targets are Linux and Android, and the UI is white mode only for now.

## Commands

Use **pnpm** only.

```sh
pnpm install
pnpm tauri dev                     # run the desktop app (Vite on :1420 + Rust backend)
pnpm build                         # tsc type-check + Vite build (frontend only)
pnpm exec tsc --noEmit             # type-check only
cd src-tauri && cargo check        # compile-check the Rust backend
pnpm tauri build --bundles deb     # release package (also: rpm, appimage)
pnpm tauri android init|dev        # Android (needs SDK/NDK + rust android targets)
```

There is no linter and no test suite yet. `pnpm build` fails if a Tauri npm plugin and its Rust crate differ in major.minor version, so bump both together. `pnpm-workspace.yaml` exempts specific plugin versions from pnpm's minimum-release-age rule.

## Conventions (user requirements)

- Modular layout: `src/modules/<module>/` holds `components/`, `hooks/`, `services/`, `<module>.types.ts`, `<module>.constants.ts`, `<module>.utils.ts`. **All types go in `<module>.types.ts`**, including component props.
- Keep files and components small. Don't duplicate logic; reuse a shared util, hook or service.
  - `services/` hold side effects (Tauri, pdf.js).
  - `hooks/` hold React state.
  - Components only compose hooks and render markup.
  - State rules live as pure functions in `*.utils.ts`, e.g. `tabs.utils.ts`, `history.utils.ts`, wrapped by a thin hook.
- Icons come from `react-icons` (the `react-icons/lu` Lucide set), not `lucide-react`.
- Style: Tailwind with tokens defined in `src/styles/index.css` `@theme`. Use token classes (`text-ink`, `bg-canvas`, `border-border`…) rather than raw colors. **No rounded corners** anywhere in the UI.
- Comment the *why* of non-obvious code. Each file starts with a short purpose note.
- `@/` resolves to `src/` (tsconfig `paths` + Vite `resolve.tsconfigPaths`).

## Architecture

**Layers.** Imports go app → modules → shared, never the reverse.
- `src/app/` is the shell. It wires modules together, builds the menus (`useAppMenus`), holds the shortcuts (`APP_SHORTCUTS`, the single source for key handlers and menu hints) and maps a tab to its page (`TabContent`).
- Modules don't import each other's internals beyond types. When a module needs something from the app layer, it's passed as props, e.g. HomePage receives `openShortcut`.
- `src/shared/` holds generic UI primitives, DOM hooks, keyboard handling (`useKeyboardShortcuts`, the only way shortcuts are registered) and utils.

**Opening a document.** `document/useOpenDocument` checks the file through the Rust `document_info` command (opens it and returns its size, reads nothing) and calls `onOpened(doc)`. `OpenedDocument` carries the path and size, never the bytes. App then:
- opens or focuses a tab (`tabs`); the same path focuses the existing tab;
- records the file in `history`.

Errors switch to the Home tab, which displays them.

**Tabs.** Home and Tools are fixed tabs, and document tabs can be closed. All tab panels stay mounted. Inactive ones use `invisible` + `inert` (not `display:none`) so the viewer keeps its scroll position and its fit-width measurement. Hooks with global effects must therefore be gated by `isActive`; for example, viewer zoom shortcuts only work on the active tab. Open document tabs (their paths and the active tab) are saved to `sessionStorage` and reopened after a page reload by `app/hooks/useTabsSession`; restoring doesn't add entries to Recent. This matters on Android: switching to another app to "Open with…" puts ours in the background, which drops the Vite dev connection, and Vite's client then always reloads the page.

**Viewer.** `pdf/pdf.service.ts` is the only code that imports pdf.js (plus the shared hooks `pdf/hooks/usePdfPageRender` and `usePdfTextLayer`, used by the viewer and the thumbnails). The document workspace is lazy-loaded by `TabContent`, so pdf.js isn't in the startup bundle.
- The worker is set up via a Vite `?url` import.
- **Bytes are read on demand by Rust.** `src-tauri/src/document_source.rs` opens the file (`open_document`, through the fs plugin so Android `content://` works) and serves byte ranges (`read_document_range`, raw `ipc::Response`, positioned reads in `spawn_blocking`). `loadPdf` feeds them to pdf.js through a `PDFDataRangeTransport` with `disableAutoFetch`, so neither JS nor the worker ever holds the whole file. Handles are closed by `close_document` on destroy, and all of them on page load. Command names are duplicated in `pdf.constants.ts`.
- `renderPage` is cancellable, sizes the canvas for devicePixelRatio (capped at `MAX_CANVAS_PIXELS`) and reports the page's real size. pdf.js's `getViewport({ rotation })` *replaces* the page's own /Rotate, so view rotation is always passed as `page.rotate + rotation`.
- Only page 1 is measured before display. `usePageSizes` starts every page at that size and corrects each one when it renders, pinning the top visible page so nothing jumps. Fit-width and fit-page fit page 1.
- `PdfPage` only mounts a canvas while near the viewport **and** its tab is active (one shared observer, `useVisibilityObserver` + `RENDER_MARGIN`). When a page stops being shown, its canvas is zeroed and `releasePage` frees pdf.js's cache for it. Pages carry `data-page-number`; `findPageAt` binary-searches them for `usePageNavigation` (rAF-throttled) and `usePageSizes`. `useScrollAnchor` keeps the scroll position stable across zoom changes (top-left by default, the pointer for Ctrl+wheel via `useWheelZoom`, a non-passive listener so the webview itself never zooms).

**Document workspace** (Acrobat-style), composed in `app/components/Workspace.tsx` because it connects modules that don't know each other.
- `viewer/useViewerState` holds one document's view: zoom (fit width / fit page / custom; Acrobat keys Ctrl+0/1/2), rotation, page display (continuous / single: only the current page is in the DOM), tool (select / hand), navigation and page sizes. `ViewerPages` renders it; `DocToolbar`, `ToolsRail` (Select, Hand, disabled "coming soon" tools), `PanelRail` + `SidePanel` are the chrome. `goToPage` scrolls in a layout effect, after the target page exists.
- Each shown page has a pdf.js text layer (selection, search highlights). Its CSS is a minimal subset of `pdf_viewer.css` in `index.css`; `--total-scale-factor` on the layer must equal the canvas scale.
- `search` scans pages in the background (`useDocumentSearch`, debounced, cancellable, cached page text) and reports `SearchMatch` ranges per text item; `app.utils` `groupHighlights` turns them into viewer highlights, which `applyHighlights` writes as `<mark>` in the text layer. Text item `i` is text layer element `i` (same filter in `getTextItems` and pdf.js's TextLayer).
- **Forms.** Viewer pages pass a `formLayerRef` to `usePdfPageRender`. The page is then drawn with `AnnotationMode.ENABLE_FORMS` and pdf.js's `AnnotationLayer` builds real inputs on top (checkbox looks come through `annotationCanvasMap`). Values live in `pdf.annotationStorage`, so they survive pages unmounting. Links are inert (`NO_LINKS`). The CSS is a subset of `pdf_viewer.css` in `index.css`.
- **Save / Save as…** are in the app's File menu (Ctrl+S, Ctrl+Shift+S). Each `Workspace` registers its commands by tab id in `useDocumentCommands`. `app/hooks/useDocumentSave` exports with `pdf.saveDocument()` (the one time the whole file is read) and calls Rust `save_document` (`document_save.rs`), which takes the bytes as the raw body and the path as a percent-encoded header. On desktop it writes a temp file and renames it over the target, so the viewer's open descriptor keeps reading the old file. `content://` URIs are written in place. After Save as, the tab follows the new path, which reloads it. Printing still prints the file on disk.
- `thumbnails` and `outline` (bookmarks) are side panels; the app routes their clicks to `goToPage`.
- Print: `system.print` → Rust `print.rs` → XDG Print portal on Linux (native dialog, the original file as an fd), or the local crate `src-tauri/plugins/android-print` (Kotlin `PrintManager`) on Android, which receives a duplicate of the descriptor Rust holds, so revoked URI grants don't matter.
- Plain-key shortcuts (arrows, PageUp…) don't fire while typing in a text field (`isTypingTarget`); modifier shortcuts and Escape still do.

**Files opened by the OS** ("Open with…" / default PDF app). This spans Rust and the frontend:
- `src-tauri/src/opened_files.rs` queues paths in `PendingFiles` and emits `opened-files://pending`. The frontend drains the queue with the `take_pending_files` command (`document/useOpenedFiles`). The queue exists so files arriving before React mounts aren't lost.
- Desktop: files arrive as argv. They come from the custom `.desktop` template `src-tauri/linux/pdf-tormentosa.desktop` (`Exec=… %F`, `MimeType=application/pdf`) and from the single-instance plugin when a second launch forwards its files. Each path is added to the fs scope in Rust.
- Android: files arrive via `RunEvent::Opened` as `content://` URIs. `bundle.fileAssociations` generates the intent filter. Their read grant is **temporary** and gets revoked when the task changes; reopening then fails with "No content provider". So Rust opens each URI as soon as it arrives (`document_source::retain_grant`) and keeps that descriptor for the process lifetime; later opens get a duplicate (`open_file`).
- Event and command names are plain strings duplicated in `document.constants.ts` and Rust. Keep them in sync.

**File access security.** The fs plugin only reads files in its scope.
- The dialog plugin adds picked files to the scope, and `opened_files.rs` adds argv files.
- `tauri-plugin-persisted-scope` keeps those grants across restarts, which is what lets Recent reopen files.
- Rust commands that take a path (`open_with.rs`, `document_source.rs`) check it with `scope::ensure_allowed`. The webview has no fs permission of its own; only Rust reads files.
- Permissions live in `src-tauri/capabilities/default.json`.

**Recent files.** `history` persists metadata (path, name, size, openedAt; max 20) to `history.json` via `@tauri-apps/plugin-store` (`LazyStore`). Right-click or long-press (`shared/hooks/useLongPress`) opens a `ContextMenu` from the `menu` module. The menu entries are data (`MenuEntry[]`, with `separator()`), built in `home/home.menus.ts`.

**OS hand-offs** (`system` module).
- "Show in file manager" uses `tauri-plugin-opener` `revealItemInDir` (FileManager1 over D-Bus on Linux).
- "Open with…" is the Rust command `open_with`, which uses the XDG Desktop Portal app chooser via `ashpd`. This is Linux-only, and `isDesktop` hides these entries on mobile.
- **Keep `ashpd` on the `async-io` feature (`default-features = false`).** Its `tokio` feature switches zbus into Tokio mode. The opener plugin's blocking D-Bus call then tries to start a second Tokio runtime inside Tauri's, which panics.

**Menus.** `menu` is generic and data-driven. `MenuList` is shared by the menu bar dropdowns and the portal-rendered `ContextMenu`, which keeps itself inside the viewport.

**Tools.** The Tools tab is a display-only catalog mirroring iLovePDF's tools and categories. It is pure data in `tools/tools.constants.ts` (`TOOL_CATEGORIES`), and nothing is implemented yet. Each tool has its own illustration (`scene`): the mascot doing that tool's job. Scenes live in `tools/components/scenes/`, one file per category, and conversions share the `ConvertScene` template.

**Mascot** (`src/shared/mascot/`). The "foca watona" is the round, front-facing plush seal, never a realistic one. `SealScene` composes it in a 120×96 viewBox, drawing in this order: `behind` → body and face (`mood`) → `front` → flippers (`left`/`right` pose). The flippers come last so they overlap and appear to grip whatever is in `front`. Props in `components/props/` are drawn around their own (0, 0) and placed with `x`/`y`/`rotate`/`scale`. Fur spots come from a fixed seed, so the seal looks the same on every render. `SealBody` derives its SVG ids from `useId`, because many seals share one page. The Home page's `FocaWatona` is an older, separate drawing.
