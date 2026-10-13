# Viewer workspace: toolbars, rails, panels, search, print

Date: 2026-10-11 · Status: approved design, pending spec review

## Goal

Give the PDF tab the feel and options of Adobe Acrobat's document view, in the
app's minimalist style (white, square corners, existing tokens, Lucide icons),
before the real PDF tools are built. Everything listed as "works" below is
functional in this pass; tools that don't exist yet appear disabled.

## Layout (Acrobat-style)

```
┌──────────────────────────────────────────────┐
│ file.pdf    [Search]   [Fit ▾][⟳][▤]  [🖨][⋯] │  doc toolbar (40px)
├──┬───────────────────────────────┬────────┬──┤
│  │                               │ panel  │  │
│T │            pages              │ 240px  │R │  T = tools rail (44px)
│  │      [‹ 3/20 ›  − 100% +]     │        │  │  R = panel rail (44px)
└──┴───────────────────────────────┴────────┴──┘
```

### Doc toolbar
- Left: file name (truncated).
- Center: search field. Ctrl+F focuses it and opens the find bar under the
  toolbar: match count ("3 of 41", "12 of 41…" while scanning), previous/next,
  Match case, Whole words. Enter = next, Shift+Enter = previous, Esc = close.
- Right: zoom dropdown (Fit width, Fit page, Actual size, 50/75/100/125/150/200/300/400%),
  rotate view (clockwise), page display toggle (Continuous / Single page),
  Print (Ctrl+P), ⋯ menu (Rotate left, Rotate right, Document properties,
  Show in file manager, Open with… — the last two desktop only).

### Tools rail (left)
- Select (default): text layer is selectable/copyable.
- Hand: drag to pan the pages; grab/grabbing cursor; text not selectable.
- Disabled, tooltip "Coming soon": Comment, Highlight, Draw, Add text, Fill & Sign.

### Panel rail (right) and side panel
- Icons: Thumbnails, Bookmarks. Clicking opens that panel (240px, between pages
  and rail); clicking the active icon closes it. One panel at a time.
- Thumbnails: page previews ~120px wide, rendered only near view, current page
  outlined in accent, list keeps the current page visible, click jumps.
- Bookmarks: outline tree, expand/collapse, click jumps to the destination's
  page and vertical position. Empty state "No bookmarks".

### Floating pill
Unchanged (page navigator + zoom).

### Per-tab state
Panel, tool, zoom, rotation, page display and search are per document tab
(state lives in the tab's workspace; tabs stay mounted).

### Narrow screens (< 768px, Android phones)
- Tools rail hidden (touch already pans); Select/Hand move into ⋯.
- Side panel overlays the pages instead of pushing them.
- Search field collapses to an icon button that opens the find bar.

## Architecture

Layers stay app → modules → shared; modules don't import each other.

| Unit | Responsibility |
|---|---|
| `app/components/DocumentWorkspace` | Lazy-loaded per document tab (replaces `DocumentViewer` in `TabContent`). Loads the PDF, holds workspace state via module hooks, composes toolbar, rails, pages, side panel, find bar; routes "go to page/destination" from thumbnails/outline and highlights from search into the pages. |
| `viewer` | Doc toolbar, tools rail, panel rail, side-panel frame, page view with canvas + text layer, zoom (adds `fit-page`), rotation, page display mode, hand tool, Document properties dialog, notice bar. |
| `thumbnails` (new) | Thumbnail list; reuses `useVisibilityObserver`; renders via `pdf.service` at small scale. |
| `outline` (new) | Loads outline, resolves destinations to `{ pageNumber, top }`, renders tree. |
| `search` (new) | `FindBar`, `useDocumentSearch` (debounced, progressive, cancellable scan, current match), pure matching in `search.utils.ts`. |
| `pdf` | Still the only pdf.js importer. Adds text content, `TextLayer` rendering, outline + destination resolution, metadata. |
| `system` | Adds `print(path)` alongside reveal / open with. |
| Rust `print.rs` | `print_document(path)`: `scope::ensure_allowed`, then platform print. |
| Rust `plugins/print` (new local crate) | Android only: Kotlin `PrintManager` + `PrintDocumentAdapter`. |

### Viewer details
- Rotation (0/90/180/270) applies to all pages. `usePageSizes` keeps unrotated
  sizes; display swaps width/height for 90/270. Canvas and text layer use the
  rotated viewport.
- Fit page: scale = min(fit width, (viewport height − vertical padding) / page 1 height).
- Single page: only the current page is laid out; previous/next, PageUp/PageDown
  and the navigator flip pages; scroll position resets to the top on flip.
- Text layer: pdf.js `TextLayer` in an absolutely positioned div over the canvas,
  rendered only while the page is shown (same gate as the canvas). Minimal
  `.textLayer` CSS copied into `index.css` (not the whole `pdf_viewer.css`).
- Hand tool: pointer drag on the scroll root updates scrollLeft/Top; text layer
  gets `pointer-events: none` while active.
- Document properties: `pdf.getMetadata()` + file info — title, author, subject,
  creator, producer, created, modified, PDF version, pages, page 1 size, file
  size, location. Uses shared `Dialog`.

### Search details
- Debounce 250ms. Scan pages 1..n in order with `getTextContent`, cache each
  page's text (joined items + item start offsets) per document.
- Matching: optional case folding; optional whole-word boundaries; matches may
  span text items. Results grow live; a new query or option change cancels the
  running scan.
- Highlights: the page view maps each match's character range onto the text
  layer spans (`textDivs`) and wraps the matched substrings in highlight marks;
  the current match uses a stronger color and is scrolled into view.
- Cost: on large files the first search reads every page's text via range
  requests. Acceptable because search is explicit.

### Print details
- Linux: `ashpd` Print portal (`print` feature): `prepare_print` (native dialog,
  cancel = not an error) then `print` with a descriptor of the original file.
- Android: Rust duplicates the descriptor it already holds (`open_file`, which
  survives revoked URI grants) and passes the raw fd to the Kotlin plugin, which
  adopts it (`ParcelFileDescriptor.adoptFd`) and streams it in
  `PrintDocumentAdapter.onWrite`. Job name = file name.
- Frontend: `system` service `printDocument(path)`; Ctrl+P and the toolbar
  button call it for the active tab.

## Shortcuts
Ctrl+F, Enter / Shift+Enter (in find bar), Esc, Ctrl+P. All registered through
`useKeyboardShortcuts` and gated by `isActive`, like zoom.

## Errors
- No outline → "No bookmarks".
- Search failure → message inside the find bar.
- Print / Open with / reveal failure → dismissible notice under the doc toolbar.
- Cancelled print dialog → nothing.

## Out of scope
Annotations and every PDF tool; resizable panels; attachments/layers panels;
two-page spreads; persistent per-file view state; tests and lint (deferred by
the user).

## Verification
`pnpm exec tsc --noEmit`, `pnpm build`, `cargo clippy` (Linux and
`aarch64-linux-android`), then a manual checklist run by the user on desktop
and Android.
