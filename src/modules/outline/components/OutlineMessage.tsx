import type { OutlineMessageProps } from "../outline.types";

/** Centered status text inside the panel (loading, empty, error). */
export function OutlineMessage({ title, description }: OutlineMessageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="text-xs text-muted">{description}</p>}
    </div>
  );
}
