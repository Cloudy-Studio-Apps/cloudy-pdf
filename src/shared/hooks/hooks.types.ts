import type { MouseEvent, PointerEvent } from "react";

/** A point on screen, in CSS pixels (viewport coordinates). */
export interface Point {
  x: number;
  y: number;
}

export interface LongPressOptions {
  /** How long the finger must stay down, in ms. */
  delay?: number;
  /** Movement (px) allowed before the hold counts as a scroll/drag instead. */
  tolerance?: number;
}

/** Spread these onto the element that should react to press-and-hold. */
export interface LongPressHandlers {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onClickCapture: (event: MouseEvent) => void;
}

/** Called with true when the element enters the observed area, false when it leaves. */
export type VisibilityCallback = (visible: boolean) => void;

/** Starts watching an element; returns a function that stops watching it. */
export type ObserveVisibility = (element: Element, onChange: VisibilityCallback) => () => void;

/** Width and height of an element, in CSS pixels. */
export interface ElementSize {
  width: number;
  height: number;
}
