/** Scenes for the "PDF Intelligence" tools. */
import { SealScene } from "@/shared/mascot/components/SealScene";
import { Arrow } from "@/shared/mascot/components/props/Arrow";
import { Doc } from "@/shared/mascot/components/props/Doc";
import { Sparkle } from "@/shared/mascot/components/props/Sparkle";
import { SpeechBubble } from "@/shared/mascot/components/props/SpeechBubble";
import type { ToolSceneProps } from "../../tools.types";

/** A long page goes in, a short sparkly summary comes out. */
export function SummarizeScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      left="out"
      right="out"
      behind={<Arrow from={[20, 30]} to={[100, 46]} bend={-22} color={color} />}
      front={
        <>
          <Doc x={15} y={62} w={18} h={32} lines={6} />
          <Doc x={104} y={66} w={18} h={14} lines={2} />
          <Sparkle x={112} y={54} color={color} />
          <Sparkle x={96} y={52} scale={0.6} color={color} />
        </>
      }
    />
  );
}

/** The seal says hi in two languages. */
export function TranslateScene({ color, className }: ToolSceneProps) {
  return (
    <SealScene
      className={className}
      mood="happy"
      left="up"
      right="up"
      behind={
        <>
          <SpeechBubble x={16} y={22} text="Hi" flip color={color} />
          <SpeechBubble x={104} y={22} text="Hola" color={color} />
        </>
      }
    />
  );
}
