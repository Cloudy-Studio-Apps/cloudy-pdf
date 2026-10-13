import type { PropertyRowProps } from "../viewer.types";

/** "Label   value" row of Document properties; missing values show a dash. */
export function PropertyRow({ label, value }: PropertyRowProps) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      {/* select-text: values (paths, titles) are worth copying, unlike the rest of the UI. */}
      <dd className="min-w-0 break-words text-ink select-text">{value ?? "—"}</dd>
    </>
  );
}
