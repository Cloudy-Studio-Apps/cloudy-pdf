import { useCallback, useState } from "react";
import { rotateBy } from "../viewer.utils";
import type { Rotation, RotationControl } from "../viewer.types";

/** View rotation of a document (all pages turn together, like Acrobat's "Rotate view"). */
export function useRotation(): RotationControl {
  const [rotation, setRotation] = useState<Rotation>(0);
  const rotateClockwise = useCallback(() => setRotation((current) => rotateBy(current, 90)), []);
  const rotateCounterclockwise = useCallback(() => setRotation((current) => rotateBy(current, -90)), []);
  return { rotation, rotateClockwise, rotateCounterclockwise };
}
