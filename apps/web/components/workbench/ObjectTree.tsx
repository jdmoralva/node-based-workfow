"use client";

import { ObjectTreeItem } from "@/components/workbench/ObjectTreeItem";
import type { TreeMenuDefinition } from "@/config/tree-menu";
import { useWorkbenchTree } from "@/features/creditmodeler/useWorkbenchTree";

type ObjectTreeProps = {
  menu: TreeMenuDefinition;
};

export function ObjectTree({ menu }: ObjectTreeProps) {
  const { expandedState, selectedKey, selectNode, toggleNode } = useWorkbenchTree(menu);

  return (
    <nav aria-label={menu.ariaLabel} className="rounded-[24px] border border-border bg-white p-4 shadow-card">
      <ul className="space-y-2">
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
