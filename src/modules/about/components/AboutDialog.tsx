import { LuFileText } from "react-icons/lu";
import { Dialog } from "@/shared/ui/Dialog";
import { useAppInfo } from "../hooks/useAppInfo";
import type { AboutDialogProps } from "../about.types";

/** Help ▸ About: app icon, name and version. */
export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const info = useAppInfo();

  return (
    <Dialog open={open} title="About" onClose={onClose}>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <div className="flex size-12 items-center justify-center bg-canvas">
          <LuFileText className="size-6 text-ink" />
        </div>
        <div>
          {/* Fallbacks cover the brief moment before Tauri answers. */}
          <p className="text-[15px] font-semibold">{info?.name ?? "Cloudy PDF"}</p>
          <p className="text-muted">Version {info?.version ?? "—"}</p>
        </div>
        <p className="text-xs text-subtle">A minimalist PDF reader.</p>
      </div>
    </Dialog>
  );
}
