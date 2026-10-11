import { PageNavigator } from "./PageNavigator";
import { ZoomControls } from "./ZoomControls";
import type { ViewerToolbarProps } from "../viewer.types";

/** Floating pill at the bottom of the viewer: page navigation | zoom. */
export function ViewerToolbar({ zoom, navigation }: ViewerToolbarProps) {
  return (
    // The full-width wrapper ignores the mouse (pointer-events-none) so the pages around
    // the pill stay scrollable and clickable; only the pill itself is interactive.
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 border border-border bg-surface/95 p-1 shadow-lg shadow-ink/5 backdrop-blur">
        <PageNavigator navigation={navigation} />
        <span className="h-4 w-px bg-border" />
        <ZoomControls zoom={zoom} />
      </div>
    </div>
  );
}
