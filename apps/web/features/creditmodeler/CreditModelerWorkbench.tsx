"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Workbench } from "@/components/workbench/Workbench";
import { creditModelerTreeMenu, type TreeMenuDefinition } from "@/config/tree-menu";
import { ConnectionBuilder } from "@/features/creditmodeler/ConnectionBuilder";
import { DataModelBuilder } from "@/features/creditmodeler/DataModelBuilder";
import type { SavedConnection } from "@/features/creditmodeler/connection-types";
import { listConnections } from "@/features/creditmodeler/connections-client";
import type { SavedDataModel, SavedDataModelSummary } from "@/features/creditmodeler/data-model-types";
import { listDataModels } from "@/features/creditmodeler/data-models-client";

const canvasHint =
  "There is currently no business logic open now. You can create a new business logic window or open one from the object tree.";

function buildCreditModelerMenu(connections: SavedConnection[], dataModels: SavedDataModelSummary[]): TreeMenuDefinition {
  return {
    ...creditModelerTreeMenu,
    items: creditModelerTreeMenu.items.map((item) => {
      if (item.label === "Connections") {
        return {
          ...item,
          toggle: item.toggle ? { ...item.toggle, expanded: connections.length > 0 } : item.toggle,
          children: connections.map((connection) => ({
            label: connection.label,
            icon: "icon-branch"
          }))
        };
      }

      if (item.label === "Data Models") {
        return {
          ...item,
          toggle: item.toggle ? { ...item.toggle, expanded: dataModels.length > 0 } : item.toggle,
          children: dataModels.map((model) => ({
            label: model.name,
            icon: "icon-cube"
          }))
        };
      }

        return item;
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

function upsertDataModel(dataModels: SavedDataModelSummary[], changed: SavedDataModelSummary): SavedDataModelSummary[] {
  const existingIndex = dataModels.findIndex((model) => model.id === changed.id);
  if (existingIndex === -1) {
    return [...dataModels, changed];
  }
  return dataModels.map((model) => (model.id === changed.id ? changed : model));
}

export function CreditModelerWorkbench() {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [dataModels, setDataModels] = useState<SavedDataModelSummary[]>([]);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const [selectedTreeKey, setSelectedTreeKey] = useState<string | null>(null);
  const droppedDataModelIds = useRef(new Set<string>());

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

  useEffect(() => {
    let active = true;
    listDataModels()
      .then((response) => {
        if (active) {
          setDataModels((current) => current.reduce(
            (items, model) => upsertDataModel(items, model),
            response.items.filter((model) => !droppedDataModelIds.current.has(model.id))
          ));
        }
      })
      .catch(() => {
        if (active) {
          setDataModels([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const menu = useMemo(() => buildCreditModelerMenu(connections, dataModels), [connections, dataModels]);
  const selectedConnectionLabel = selectedTreeKey?.startsWith("Connections/") ? selectedTreeKey.slice("Connections/".length) : null;
  const selectedConnection = selectedConnectionLabel ? connections.find((connection) => connection.label === selectedConnectionLabel) : null;
  const selectedDataModelLabel = selectedTreeKey?.startsWith("Data Models/") ? selectedTreeKey.slice("Data Models/".length) : null;
  const selectedDataModel = selectedDataModelLabel ? dataModels.find((model) => model.name === selectedDataModelLabel) : null;
  const handleConnectionSaved = (connection: SavedConnection) => setConnections((current) => upsertConnection(current, connection));
  const handleConnectionDropped = (connectionId: string) => {
    setConnections((current) => current.filter((connection) => connection.id !== connectionId));
    setSelectedTreeKey(null);
  };
  const handleTreeSelect = (key: string) => {
    setSelectedTreeKey(key);
    setSelectionRevision((current) => current + 1);
  };
  const handleDataModelSaved = (model: SavedDataModel) => {
    droppedDataModelIds.current.delete(model.id);
    setDataModels((current) => upsertDataModel(current, model));
  };
  const handleDataModelDropped = (modelId: string) => {
    droppedDataModelIds.current.add(modelId);
    setDataModels((current) => current.filter((model) => model.id !== modelId));
    setSelectedTreeKey(null);
  };
  const canvasContent = selectedTreeKey === "Connections" ? (
    <ConnectionBuilder key={`new-connection-${selectionRevision}`} onConnectionSaved={handleConnectionSaved} />
  ) : selectedTreeKey === "Data Models" ? (
    <DataModelBuilder key={`new-data-model-${selectionRevision}`} onDataModelDropped={handleDataModelDropped} onDataModelSaved={handleDataModelSaved} />
  ) : selectedDataModel ? (
    <DataModelBuilder key={`${selectedDataModel.id}-${selectionRevision}`} modelId={selectedDataModel.id} onDataModelDropped={handleDataModelDropped} onDataModelSaved={handleDataModelSaved} />
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
