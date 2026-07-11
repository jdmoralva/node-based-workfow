"use client";

import type { CSSProperties } from "react";

import { Icon } from "@/components/icons/Icon";
import type { TreeMenuItem } from "@/config/tree-menu";

type ObjectTreeItemProps = {
  expandedState: Map<string, boolean>;
  item: TreeMenuItem;
  onSelect: (key: string) => void;
  onToggle: (key: string) => void;
  depth?: number;
  path?: string[];
  selectedKey: string | null;
};

export function ObjectTreeItem({ expandedState, item, onSelect, onToggle, depth = 0, path = [], selectedKey }: ObjectTreeItemProps) {
  const nodePath = [...path, item.label];
  const nodeKey = nodePath.join("/");
  const hasChildren = Boolean(item.children?.length);
  const isExpanded = item.toggle ? expandedState.get(nodeKey) ?? item.toggle.expanded : true;
  const isSelected = selectedKey === nodeKey;
  const style: CSSProperties = { paddingLeft: `${depth * 12}px` };

  return (
    <li className="space-y-2" style={style}>
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            aria-controls={item.toggle?.controls}
            aria-expanded={isExpanded}
            aria-label={item.toggle?.label}
            className="rounded-full border border-border bg-white px-2 py-1 text-xs font-medium text-slate-600"
            onClick={() => onToggle(nodeKey)}
            type="button"
          >
            {isExpanded ? "-" : "+"}
          </button>
        ) : (
          <span className="inline-block w-8" />
        )}
        <button
          aria-pressed={isSelected}
          className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${isSelected ? "bg-brand text-white" : "text-slate-700 hover:bg-slate-100"}`}
          onClick={() => onSelect(nodeKey)}
          type="button"
        >
          <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-brand"}`} name={item.icon as never} />
          <span>{item.label}</span>
        </button>
      </div>
      {hasChildren && isExpanded ? (
        <ul className="space-y-2" id={item.toggle?.controls}>
          {item.children?.map((child) => (
            <ObjectTreeItem
              depth={depth + 1}
              expandedState={expandedState}
              item={child}
              key={`${item.label}-${child.label}`}
              onSelect={onSelect}
              onToggle={onToggle}
              path={nodePath}
              selectedKey={selectedKey}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
