import { OutlineItem } from "./OutlineItem";
import type { OutlineTreeProps } from "../outline.types";

/** A level of the bookmark tree; nested levels are rendered by OutlineItem. */
export function OutlineTree({ nodes, depth, onSelect }: OutlineTreeProps) {
  return (
    <ul role={depth === 0 ? "tree" : "group"}>
      {nodes.map((node) => (
        <OutlineItem key={node.id} node={node} depth={depth} onSelect={onSelect} />
      ))}
    </ul>
  );
}
