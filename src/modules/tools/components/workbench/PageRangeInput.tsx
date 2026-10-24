import { useId } from "react";
import { cn } from "@/shared/utils/class-names.utils";
import type { PageRangeInputProps } from "../../tools.types";

/** Text field for page ranges ("1-3, 5, 8-"), with the page count and the parse error. */
export function PageRangeInput({ value, onChange, pageCount, error }: PageRangeInputProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs text-muted">
        Pages (1–{pageCount}), separated by commas. "8-" runs to the end.
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. 1-3, 5, 8-"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-9 border bg-surface px-3 outline-none focus-visible:border-accent",
          error ? "border-danger" : "border-border",
        )}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
