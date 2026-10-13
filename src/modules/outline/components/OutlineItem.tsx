import { useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import { cn } from "@/shared/utils/class-names.utils";
import { OUTLINE_INDENT } from "../outline.constants";
import { OutlineTree } from "./OutlineTree";
import type { OutlineItemProps } from "../outline.types";

/** One bookmark: expand toggle (if it has children) and its title, which jumps to it. */
export function OutlineItem({ node, depth, onSelect }: OutlineItemProps) {
  // Collapsed by default, like Acrobat: long documents start as a short list of chapters.
  const [isExpanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <li role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div className="flex items-start hover:bg-hover" style={{ paddingLeft: depth * OUTLINE_INDENT }}>
        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            onClick={() => setExpanded((expanded) => !expanded)}
            className="flex size-7 shrink-0 items-center justify-center text-muted hover:text-ink"
          >
            <LuChevronRight className={cn("size-3.5 transition-transform", isExpanded && "rotate-90")} />
          </button>
        ) : (
          <span className="size-7 shrink-0" />
        )}
        <button
          type="button"
          disabled={!node.dest}
          onClick={() => onSelect(node)}
          className="min-w-0 flex-1 py-1.5 pr-3 text-left leading-snug text-ink disabled:text-muted"
        >
          {node.title}
        </button>
      </div>
      {hasChildren && isExpanded && <OutlineTree nodes={node.children} depth={depth + 1} onSelect={onSelect} />}
    </li>
  );
}
