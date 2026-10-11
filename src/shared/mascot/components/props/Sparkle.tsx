import { toTransform } from "../../mascot.utils";
import type { ItemProps } from "../../mascot.types";

/** Four-point twinkle, for "done!" and magic moments. Size via `scale`. */
export function Sparkle({ color = "#fbbf24", ...placement }: ItemProps) {
  return (
    <path
      d="M0 -4 L1.1 -1.1 L4 0 L1.1 1.1 L0 4 L-1.1 1.1 L-4 0 L-1.1 -1.1 Z"
      fill={color}
      transform={toTransform(placement)}
    />
  );
}
