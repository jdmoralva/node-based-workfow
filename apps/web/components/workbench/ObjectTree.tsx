"use client";

import { Icon } from "@/components/icons/Icon";
import { ObjectTreeItem } from "@/components/workbench/ObjectTreeItem";
import type { TreeMenuDefinition } from "@/config/tree-menu";
import { useWorkbenchTree } from "@/features/creditmodeler/useWorkbenchTree";

type ObjectTreeProps = {
  menu: TreeMenuDefinition;
};

export function ObjectTree({ menu }: ObjectTreeProps) {
  const { expandedState, selectedKey, selectNode, toggleNode } = useWorkbenchTree(menu);

  return (
    <nav aria-label={menu.ariaLabel} className="rv-tree-panel" data-testid="workbench-tree">
      <div className="rv-tree-search-wrap">
        <input aria-label="Search" className="rv-tree-search" placeholder="Search" type="search" />
        <Icon className="rv-tree-search__icon" name="icon-search" />
      </div>
      <div className="rv-tree-actions">
        <button aria-label="Add object" type="button">
          <Icon className="h-[0.95rem] w-[0.95rem]" name="icon-plus" />
        </button>
        <button aria-label="Grid view" type="button">
          <Icon className="h-[0.95rem] w-[0.95rem]" name="icon-grid" />
        </button>
        <button aria-label="Branch view" type="button">
          <Icon className="h-[0.95rem] w-[0.95rem]" name="icon-branch" />
        </button>
      </div>
      <ul className="rv-tree-list">
        {menu.items.map((item) => (
          <ObjectTreeItem
            expandedState={expandedState}
            item={item}
            key={item.label}
            onSelect={selectNode}
            onToggle={toggleNode}
            selectedKey={selectedKey}
          />
        ))}
      </ul>
    </nav>
  );
}
