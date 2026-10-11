/** Types for the tools module (the Tools tab: catalog of PDF tools). */
import type { ComponentType, ReactNode } from "react";
import type { SealMood } from "@/shared/mascot/mascot.types";

/** Every tool illustration takes the category color (for arrows, labels, sparkles). */
export interface ToolSceneProps {
  color: string;
  className?: string;
}

/** One PDF tool. Only described for now; none of them is implemented yet. */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  /** Illustration: the seal doing this tool's job. */
  scene: ComponentType<ToolSceneProps>;
}

/** A group of related tools, shown as one section (same grouping as iLovePDF). */
export interface ToolCategory {
  id: string;
  title: string;
  /** Accent color for every tool in the group; tells categories apart at a glance. */
  color: string;
  tools: ToolDefinition[];
}

/** The shared layout of conversion scenes: source item → seal → result item. */
export interface ConvertSceneProps extends ToolSceneProps {
  /** Source item, drawn around (0, 0). */
  from: ReactNode;
  /** Result item, drawn around (0, 0). */
  to: ReactNode;
  mood?: SealMood;
}

export interface ToolCategorySectionProps {
  category: ToolCategory;
}

export interface ToolCardProps {
  tool: ToolDefinition;
  color: string;
}
