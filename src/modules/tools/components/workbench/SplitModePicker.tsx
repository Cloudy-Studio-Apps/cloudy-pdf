import { cn } from "@/shared/utils/class-names.utils";
import { SPLIT_MODE_LABELS } from "../../tools.constants";
import type { SplitModePickerProps } from "../../tools.types";

/** Choice of how Split writes its output, as a row of options (radio buttons). */
export function SplitModePicker({ modes, value, onChange }: SplitModePickerProps) {
  return (
    <div role="radiogroup" className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
      {modes.map((mode) => {
        const { title, hint } = SPLIT_MODE_LABELS[mode];
        const checked = mode === value;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={checked}
            className={cn(
              "flex flex-col items-start gap-0.5 border px-3 py-2 text-left transition-colors",
              checked ? "border-ink" : "border-border hover:bg-hover",
            )}
            onClick={() => onChange(mode)}
          >
            <span className="font-medium">{title}</span>
            <span className="text-xs text-muted">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
