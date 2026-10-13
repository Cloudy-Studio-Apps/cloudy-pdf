# Annotations foundation + Draw tool — design

Sub-project 1 of the tools rail (Draw, then Text, Highlight, Comment, Signature).

## Goal

The user can pick **Draw** in the tools rail and draw freehand on a page. Each stroke
is its own object. With the **Select** tool the user can click a stroke, drag it
anywhere on its page, or delete it. Ctrl+Z / Ctrl+Shift+Z undo and redo. **Save** and
**Save As…** write the strokes into the PDF as standard Ink annotations.

Success: draw two strokes, select the right-hand one, drag it elsewhere, undo the move,
delete the other, save, reopen in another PDF reader → the remaining stroke is there.

## Decisions

| Topic | Decision |
|---|---|
| Object | One stroke = one annotation. No grouping, no multi-select (later if needed). |
| Draw options | Colour (6 swatches) and thickness (3 sizes), in a small popover on the Draw rail button. Kept per session, not persisted. |
| After drawing | Stays in the Draw tool (like Acrobat), so several strokes can be drawn in a row. |
| Selecting | Select tool: click a stroke → selected (dashed box around it). Click empty page → deselect. Text selection still works off the strokes. |
| Moving | Drag a selected (or just-pressed) stroke; it moves within its page (clamped to the page). |
| Deleting | Delete / Backspace on the selection; Escape deselects. |
| Undo / redo | Ctrl+Z / Ctrl+Shift+Z for add, move, delete. Only while the document tab is active and not typing in a field. |
| Unsaved state | Strokes count as unsaved changes: Save is enabled, same as edited form fields. |
| Existing annotations | Strokes already saved in a PDF render on the canvas as normal and are **not** editable (v1 limit). After Save As the tab reloads, so the new strokes become part of the page. |
| Phones | The rail is hidden; Draw joins Select / Hand in the ⋯ menu. While Draw is active, finger drags draw instead of scrolling. |

## Architecture

New module `src/modules/annotations/`:

- `annotations.types.ts` — `InkAnnotation { id, pageNumber, color, thickness, points: Point[] }`.
  Points are in **page space**: the page's unrotated-by-view viewport at scale 1
  (top-left origin, y down), the same space as `PageSize`. Zoom and view rotation are
  applied only when displaying, so the data never changes with them.
- `annotations.constants.ts` — colours, thicknesses, hit tolerance.
- `annotations.utils.ts` — pure state rules: `annotationsReducer` (add / move / delete /
  undo / redo with a history stack), `strokeBounds`, `translateStroke`, `clampToPage`,
  `toSvgPath`, screen ↔ page-space conversion for each view rotation.
- `hooks/useAnnotations(pdf)` — one document's annotations: state from the reducer,
  selection, the "saved" history mark (→ `isModified`), and undo/redo shortcuts gated
  by `isActive`.
- `hooks/useStrokeDrawing`, `hooks/useStrokeDrag` — pointer gestures (pointer capture,
  rAF-throttled updates).
- `components/AnnotationOverlay` — one SVG per shown page, sized like the canvas, drawing
  that page's strokes plus the live stroke. A wider invisible path per stroke is the hit
  area (`pointer-events: stroke`). The SVG itself catches pointers only in Draw mode.
- `components/DrawOptions` — colour and thickness popover.

pdf module: `pdf.service` gains `setInkAnnotations(pdf, annotations)`, the only code that
knows pdf.js's internal editor format. Before export it puts each stroke into
`pdf.annotationStorage` under a `pdfjs_internal_editor_<id>` key, as
`{ annotationType: INK, pageIndex, rect, rotation: 0, color, thickness, opacity: 1,
paths: { lines, points } }` in PDF coordinates (`viewport.convertToPdfPoint`), and removes
strokes that were deleted. `saveDocument` then writes them as Ink annotations with an
appearance stream. **Risk:** this format is internal to pdf.js. It's isolated in one
function and checked again on every pdf.js upgrade.

Viewer: `ViewerTool` gains `"draw"`; `ToolsRail` enables Draw; the remaining tools stay
"coming soon". `PdfPage` receives an overlay through a render prop
(`renderPageOverlay(pageNumber, size, scale, rotation)`) so the viewer module doesn't
depend on the annotations module. The app's `Workspace` connects them.

Saving: `useDocumentSave` treats the document as modified when the form fields **or** the
annotations are; before `exportPdf` it calls `setInkAnnotations`; after a save it marks
the annotation history as saved.

## Error handling

- Strokes shorter than 2 points (a click in Draw mode) are discarded.
- A failed save keeps the strokes and the modified state; the existing notice bar shows the error.
- Closing a tab with unsaved strokes loses them (same as form values today; a prompt is a separate task).

## Testing

There is no test suite yet. The pure functions in `annotations.utils.ts` are written to be
testable in isolation. Manual check: the success scenario above, at zoom 50% / 200% and with
the view rotated 90°, on desktop and Android.
