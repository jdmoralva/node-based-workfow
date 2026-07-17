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
  const hasChildren = item.kind === "submenu";
  const childItems = item.children ?? [];
  const isExpanded = item.toggle ? expandedState.get(nodeKey) ?? item.toggle.expanded : true;
  const isSelected = selectedKey === nodeKey;
  const depthOffset = `${depth * 12}px`;

  return (
    <li className="rv-tree-item" data-depth={depth}>
      <div className="rv-tree-item__row" style={{ "--rv-tree-depth-offset": depthOffset } as CSSProperties}>
        {hasChildren ? (
          <button
            aria-controls={item.toggle?.controls}
            aria-expanded={isExpanded}
            aria-label={item.toggle?.label}
            className="rv-tree-item__toggle"
            onClick={() => onToggle(nodeKey)}
            type="button"
          >
            <span className={`rv-tree-item__caret ${isExpanded ? "rv-tree-item__caret--down" : ""}`} />
          </button>
        ) : (
          <span className="rv-tree-item__spacer" />
        )}
        <button
          aria-pressed={isSelected}
          className={`rv-tree-item__option ${depth === 0 ? "rv-tree-item__option--top" : ""} ${isSelected ? "rv-tree-item__option--selected" : ""}`}
          onClick={() => onSelect(nodeKey)}
          type="button"
        >
          <Icon className="rv-tree-item__icon" name={item.icon as never} />
          <span className="rv-tree-item__label" title={item.label}>
            {item.label}
          </span>
          {item.more ? (
            <span aria-hidden="true" className="rv-tree-item__more">
              <Icon className="h-[0.9rem] w-[0.9rem]" name="icon-ellipsis" />
            </span>
          ) : null}
        </button>
      </div>
      {hasChildren && isExpanded && childItems.length > 0 ? (
        <ul className="rv-tree-children" id={item.toggle?.controls}>
          {childItems.map((child) => (
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
