/** Page geometry helpers shared by the viewer and the thumbnails. */
import type { PageSize } from "./pdf.types";

/** The size a page takes on screen once turned by `rotation` degrees (90/270 swap the sides). */
export function rotateSize(size: PageSize, rotation: number): PageSize {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}
