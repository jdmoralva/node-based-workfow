"use client";

import { useMemo, useState } from "react";

import type { TreeMenuDefinition, TreeMenuItem } from "@/config/tree-menu";

function buildInitialExpanded(menu: TreeMenuDefinition) {
  const expanded = new Map<string, boolean>();

  const visit = (items: TreeMenuItem[], path: string[]) => {
    for (const item of items) {
      const nextPath = [...path, item.label];
      const key = nextPath.join("/");

      if (item.toggle) {
        expanded.set(key, item.toggle.expanded);
      }

      if (item.children?.length) {
        visit(item.children, nextPath);
      }
    }
  };

  visit(menu.items, []);
  return expanded;
}

export function useWorkbenchTree(menu: TreeMenuDefinition) {
  const initialExpanded = useMemo(() => buildInitialExpanded(menu), [menu]);
  const [expandedState, setExpandedState] = useState<Map<string, boolean>>(initialExpanded);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const toggleNode = (key: string) => {
    setExpandedState((current) => {
      const next = new Map(current);
      next.set(key, !current.get(key));
      return next;
    });
  };

  return {
    expandedState,
    selectedKey,
    selectNode: (key: string) => setSelectedKey(key),
    toggleNode
  };
}
