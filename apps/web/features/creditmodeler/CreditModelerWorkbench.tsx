"use client";

import { useEffect, useMemo, useState } from "react";

import { Workbench } from "@/components/workbench/Workbench";
import { creditModelerTreeMenu, type TreeMenuDefinition } from "@/config/tree-menu";
import { ConnectionBuilder } from "@/features/creditmodeler/ConnectionBuilder";
import type { SavedConnection } from "@/features/creditmodeler/connection-types";
import { listConnections } from "@/features/creditmodeler/connections-client";

const canvasHint =
  "There is currently no business logic open now. You can create a new business logic window or open one from the object tree.";

function buildCreditModelerMenu(connections: SavedConnection[]): TreeMenuDefinition {
  return {
    ...creditModelerTreeMenu,
    items: creditModelerTreeMenu.items.map((item) => {
      if (item.label !== "Connections") {
        return item;
      }

      return {
        ...item,
        toggle: item.toggle ? { ...item.toggle, expanded: connections.length > 0 } : item.toggle,
        children: connections.map((connection) => ({
          label: connection.label,
          icon: "icon-branch"
        }))
      };
    })
  };
}

function upsertConnection(connections: SavedConnection[], changed: SavedConnection): SavedConnection[] {
  const existingIndex = connections.findIndex((connection) => connection.id === changed.id);
  if (existingIndex === -1) {
    return [...connections, changed];
  }
  return connections.map((connection) => (connection.id === changed.id ? changed : connection));
}

export function CreditModelerWorkbench() {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const [selectedTreeKey, setSelectedTreeKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listConnections()
      .then((response) => {
        if (active) {
          setConnections(response.connections);
        }
      })
      .catch(() => {
        if (active) {
          setConnections([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const menu = useMemo(() => buildCreditModelerMenu(connections), [connections]);
  const selectedConnectionLabel = selectedTreeKey?.startsWith("Connections/") ? selectedTreeKey.slice("Connections/".length) : null;
  const selectedConnection = selectedConnectionLabel ? connections.find((connection) => connection.label === selectedConnectionLabel) : null;
  const handleConnectionSaved = (connection: SavedConnection) => setConnections((current) => upsertConnection(current, connection));
  const handleConnectionDropped = (connectionId: string) => {
    setConnections((current) => current.filter((connection) => connection.id !== connectionId));
    setSelectedTreeKey(null);
  };
  const handleTreeSelect = (key: string) => {
    setSelectedTreeKey(key);
    setSelectionRevision((current) => current + 1);
  };
  const canvasContent = selectedTreeKey === "Connections" ? (
    <ConnectionBuilder key={`new-connection-${selectionRevision}`} onConnectionSaved={handleConnectionSaved} />
  ) : selectedConnection ? (
    <ConnectionBuilder
      connectionId={selectedConnection.id}
      key={`${selectedConnection.id}-${selectionRevision}`}
      onConnectionDropped={handleConnectionDropped}
      onConnectionSaved={handleConnectionSaved}
    />
  ) : undefined;

  return <Workbench canvasContent={canvasContent} hint={canvasHint} menu={menu} onTreeSelect={handleTreeSelect} selectedTreeKey={selectedTreeKey} />;
}
