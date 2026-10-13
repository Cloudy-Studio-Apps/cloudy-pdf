import { LuCircleAlert, LuX } from "react-icons/lu";
import { IconButton } from "@/shared/ui/IconButton";
import type { NoticeBarProps } from "../viewer.types";

/** One-line error under the toolbar (e.g. printing failed), until dismissed. */
export function NoticeBar({ message, onDismiss }: NoticeBarProps) {
  return (
    <div role="alert" className="flex h-8 shrink-0 items-center gap-2 border-b border-border bg-surface pr-1 pl-3 text-xs text-danger">
      <LuCircleAlert className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate" title={message}>
        {message}
      </span>
      <IconButton icon={LuX} label="Dismiss" onClick={onDismiss} />
    </div>
  );
}
