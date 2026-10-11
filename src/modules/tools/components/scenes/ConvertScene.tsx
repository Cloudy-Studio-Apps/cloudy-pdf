import { SealScene } from "@/shared/mascot/components/SealScene";
import { Arrow } from "@/shared/mascot/components/props/Arrow";
import type { ConvertSceneProps } from "../../tools.types";

/**
 * Template for conversions: the seal holds the source on its left, the result on
 * its right, and an arrow arcs over its head from one to the other. The items are
 * drawn around (0, 0); this places them, so each conversion only picks its items.
 */
export function ConvertScene({ from, to, color, mood = "sleepy", className }: ConvertSceneProps) {
  return (
    <SealScene
      className={className}
      mood={mood}
      left="out"
      right="out"
      behind={<Arrow from={[20, 38]} to={[100, 38]} bend={-26} color={color} />}
      front={
        <>
          <g transform="translate(16 62)">{from}</g>
          <g transform="translate(104 62)">{to}</g>
        </>
      }
    />
  );
}
