import { useEffect, useState } from "react";

/**
 * Hand tool: dragging with the mouse scrolls the pages. Returns true while dragging
 * (for the grabbing cursor).
 *
 * Mouse and pen only: on touch screens the browser's own scrolling already pans.
 */
export function useHandTool(container: HTMLElement | null, enabled: boolean): boolean {
  const [isPanning, setPanning] = useState(false);

  useEffect(() => {
    if (!container || !enabled) return;
    let start: { x: number; y: number; left: number; top: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType === "touch") return;
      start = { x: event.clientX, y: event.clientY, left: container.scrollLeft, top: container.scrollTop };
      // Keep receiving moves even if the pointer leaves the window mid-drag.
      container.setPointerCapture(event.pointerId);
      setPanning(true);
      // No text selection or image dragging while panning.
      event.preventDefault();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!start) return;
      container.scrollLeft = start.left - (event.clientX - start.x);
      container.scrollTop = start.top - (event.clientY - start.y);
    };
    const onPointerUp = () => {
      if (!start) return;
      start = null;
      setPanning(false);
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      setPanning(false);
    };
  }, [container, enabled]);

  return isPanning;
}
