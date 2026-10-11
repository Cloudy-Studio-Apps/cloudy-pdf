import { LuMinus, LuMoveHorizontal, LuPlus } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { cn } from "@/shared/utils/class-names.utils";
import { toPercent } from "@/shared/utils/math.utils";
import type { ZoomControlsProps } from "../viewer.types";

/** Zoom out, current percentage, zoom in, and the fit-width toggle. */
export function ZoomControls({ zoom }: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <IconButton icon={LuMinus} label="Zoom out" disabled={!zoom.canZoomOut} onClick={zoom.zoomOut} />
      {/* Fixed width + tabular-nums: the toolbar doesn't shift when the number changes (90% → 100%). */}
      <span className="w-11 text-center tabular-nums text-muted">{toPercent(zoom.scale)}</span>
      <IconButton icon={LuPlus} label="Zoom in" disabled={!zoom.canZoomIn} onClick={zoom.zoomIn} />
      <IconButton
        icon={LuMoveHorizontal}
        label="Fit width"
        // Highlighted while fit-width is active, so it reads as a toggle.
        className={cn(zoom.mode === "fit-width" && "bg-hover text-ink")}
        onClick={zoom.fitWidth}
      />
    </div>
  );
}
