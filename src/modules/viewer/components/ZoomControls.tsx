import { LuMinus, LuMoveHorizontal, LuPlus } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import { cn } from "@/shared/utils/class-names.utils";
import { toPercent } from "@/shared/utils/math.utils";
import type { ZoomControlsProps } from "../viewer.types";

export function ZoomControls({ zoom }: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <IconButton icon={LuMinus} label="Zoom out" disabled={!zoom.canZoomOut} onClick={zoom.zoomOut} />
      <span className="w-11 text-center tabular-nums text-muted">{toPercent(zoom.scale)}</span>
      <IconButton icon={LuPlus} label="Zoom in" disabled={!zoom.canZoomIn} onClick={zoom.zoomIn} />
      <IconButton
        icon={LuMoveHorizontal}
        label="Fit width"
        className={cn(zoom.mode === "fit-width" && "bg-hover text-ink")}
        onClick={zoom.fitWidth}
      />
    </div>
  );
}
