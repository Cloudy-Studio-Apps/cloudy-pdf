import { PageNavigator } from "./PageNavigator";
import { ZoomControls } from "./ZoomControls";
import type { ViewerToolbarProps } from "../viewer.types";

export function ViewerToolbar({ zoom, navigation }: ViewerToolbarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-surface/95 p-1 shadow-lg shadow-ink/5 backdrop-blur">
        <PageNavigator navigation={navigation} />
        <span className="h-4 w-px bg-border" />
        <ZoomControls zoom={zoom} />
      </div>
    </div>
  );
}
