import type { ViewerMessageProps } from "../viewer.types";

export function ViewerMessage({ title, description }: ViewerMessageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-muted">{description}</p>}
    </div>
  );
}
