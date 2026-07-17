"use client";

import { useEffect, useMemo, useState } from "react";

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

function findMenuItem(menu: TreeMenuDefinition, key: string | null): TreeMenuItem | null {
  if (!key) {
    return null;
  }

  const segments = key.split("/");
  let items = menu.items;
  let match: TreeMenuItem | undefined;

  for (const segment of segments) {
    match = items.find((item) => item.label === segment);
    if (!match) {
      return null;
    }
    items = match.children ?? [];
  }

  return match ?? null;
}

export function useWorkbenchTree(menu: TreeMenuDefinition) {
  const initialExpanded = useMemo(() => buildInitialExpanded(menu), [menu]);
  const [expandedState, setExpandedState] = useState<Map<string, boolean>>(initialExpanded);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedItem = useMemo(() => findMenuItem(menu, selectedKey), [menu, selectedKey]);

  useEffect(() => {
    setExpandedState((current) => {
      const next = new Map(current);
      for (const [key, expanded] of initialExpanded) {
        if (!next.has(key) || expanded) {
          next.set(key, expanded);
        }
      }
      return next;
    });
  }, [initialExpanded]);

  const toggleNode = (key: string) => {
    setExpandedState((current) => {
      const next = new Map(current);
      next.set(key, !current.get(key));
      return next;
    });
  };

  return {
    expandedState,
    selectedItem,
    selectedKey,
    selectNode: (key: string) => setSelectedKey(key),
    toggleNode
  };
}
