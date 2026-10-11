import { LuFileText, LuFolderOpen } from "react-icons/lu";
import { formatShortcut } from "@/shared/keyboard/keyboard.utils";
import { Button } from "@/shared/ui/Button";
import { APP_SHORTCUTS } from "../app.constants";
import type { WelcomeScreenProps } from "../app.types";

export function WelcomeScreen({ onOpen, isOpening, error }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-surface">
        <LuFileText className="size-6 text-muted" />
      </div>
      <div className="space-y-1">
        <h1 className="text-[15px] font-semibold">No document open</h1>
        <p className="text-muted">
          Open a PDF to start reading, or press{" "}
          <kbd className="font-sans text-ink">{formatShortcut(APP_SHORTCUTS.open)}</kbd>
        </p>
      </div>
      <Button icon={LuFolderOpen} onClick={onOpen} disabled={isOpening}>
        {isOpening ? "Opening…" : "Open file"}
      </Button>
      {error && <p className="max-w-sm text-xs text-red-600">{error}</p>}
    </div>
  );
}
