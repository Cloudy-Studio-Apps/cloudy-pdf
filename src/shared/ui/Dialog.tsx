import { LuX } from "react-icons/lu";
import { useKeyboardShortcuts } from "@/shared/keyboard/useKeyboardShortcuts";
import { IconButton } from "./IconButton";
import type { DialogProps } from "./ui.types";

export function Dialog({ open, title, onClose, children }: DialogProps) {
  useKeyboardShortcuts(open ? [{ shortcut: { key: "Escape" }, handler: onClose }] : []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-80 rounded-xl border border-border bg-surface shadow-xl shadow-ink/5"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 pt-3">
          <h2 className="font-medium text-muted">{title}</h2>
          <IconButton icon={LuX} label="Close" onClick={onClose} />
        </header>
        <div className="px-4 pb-5">{children}</div>
      </div>
    </div>
  );
}
