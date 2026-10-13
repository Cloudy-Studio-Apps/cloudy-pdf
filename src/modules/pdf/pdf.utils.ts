/** Page geometry and colour helpers shared by the viewer, the thumbnails and the pdf service. */
import type { PageSize } from "./pdf.types";

/** The size a page takes on screen once turned by `rotation` degrees (90/270 swap the sides). */
export function rotateSize(size: PageSize, rotation: number): PageSize {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}

/** "#rrggbb" → [r, g, b] in 0–255, the colour format of pdf.js's annotation editors. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
