"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { SavedConnection } from "@/features/creditmodeler/connection-types";
import { listConnections } from "@/features/creditmodeler/connections-client";
import { ColumnMultiSelect } from "@/features/creditmodeler/ColumnMultiSelect";
import {
  createDataModel,
  deleteDataModel,
  getDataModel,
  inspectConnectionSchema,
  testSavedDataModel,
  testUnsavedDataModel,
  updateDataModel
} from "@/features/creditmodeler/data-models-client";
import type {
  DataModelBusinessRule,
  DataModelDefinition,
  DataModelDiagnostic,
  DataModelDimension,
  DataModelRelationship,
  DataModelSchemaObject,
  DataModelStatus,
  SavedDataModel
} from "@/features/creditmodeler/data-model-types";

const MAX_SOURCES = 5;
const MAX_DIMENSIONS = 25;
const MAX_BUSINESS_RULES = 50;

const outputTypes: DataModelBusinessRule["output_type"][] = ["unknown", "text", "integer", "real", "numeric", "boolean", "date", "datetime"];

type SchemaState = {
  error: string | null;
  loading: boolean;
  objects: DataModelSchemaObject[];
};

type DataModelBuilderProps = {
  modelId?: string;
  onDataModelDropped?: (modelId: string) => void;
  onDataModelSaved?: (model: SavedDataModel) => void;
};

type BuilderSectionProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  number: string;
  state: string;
  stateTone?: "complete" | "warning";
  summary: string;
  title: string;
};

type ModelTable = NonNullable<DataModelDefinition["fact_table"]> | DataModelDimension;

type RelationshipSuggestion = {
  id: string;
  parentTableId: string;
  parentSuggestionId: string | null;
  childTableId: string | null;
  parentTable: string;
  referencedTable: string;
  connectionId: string;
  depth: number;
  columnPairs: Array<{ parent_column: string; child_column: string }>;
  reusableTableIds: string[];
};

function emptyModel(): DataModelDefinition {
  return { schema_version: 2, sources: [], fact_table: null, dimensions: [], relationships: [], business_rules: [], measures: [], metadata: {} };
}

function aliasFor(prefix: string, value: string): string {
  const normalized = value
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `${prefix}_${normalized || "source"}`;
}

function itemId(prefix: "fact" | "dim" | "rel" | "rule"): string {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${value}`;
}

function modelTables(model: DataModelDefinition): ModelTable[] {
  return [...(model.fact_table ? [model.fact_table] : []), ...model.dimensions];
}

function connectedTableIds(model: DataModelDefinition): Set<string> {
  const connected = new Set<string>();
  if (!model.fact_table?.table) {
    return connected;
  }
  connected.add(model.fact_table.id);
  let changed = true;
  while (changed) {
    changed = false;
    model.relationships.forEach((relationship) => {
      if (connected.has(relationship.parent_table_id) && !connected.has(relationship.child_table_id)) {
        connected.add(relationship.child_table_id);
        changed = true;
      }
    });
  }
  return connected;
}

function descendantTableIds(model: DataModelDefinition, tableId: string, excludedRelationshipId?: string): Set<string> {
  const descendants = new Set<string>();
  const pending = [tableId];
  while (pending.length) {
    const parentId = pending.shift();
    model.relationships.forEach((relationship) => {
      if (
        relationship.id !== excludedRelationshipId
        && relationship.parent_table_id === parentId
        && !descendants.has(relationship.child_table_id)
      ) {
        descendants.add(relationship.child_table_id);
        pending.push(relationship.child_table_id);
      }
    });
  }
  descendants.delete(tableId);
  return descendants;
}

function uniqueDimensionAlias(model: DataModelDefinition, table: string): string {
  const base = aliasFor("dim", table);
  const aliases = new Set(modelTables(model).map((item) => item.alias.trim().toLowerCase()));
  if (!aliases.has(base)) {
    return base;
  }
  let suffix = 2;
  while (aliases.has(`${base}_${suffix}`)) {
    suffix += 1;
  }
  return `${base}_${suffix}`;
}

function modelSnapshot(name: string, description: string, model: DataModelDefinition): string {
  return JSON.stringify({ name, description, model });
}

function defaultPrimaryKey(schemaObject: DataModelSchemaObject | undefined): string[] {
  return schemaObject?.columns.filter((column) => column.primary_key).map((column) => column.name) ?? [];
}

function schemaErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim() ? error.message : "Schema metadata could not be loaded.";
}

function compatiblePrimaryKey(current: string[], schemaObject: DataModelSchemaObject | undefined): string[] {
  if (!schemaObject) {
    return current;
  }
  const columns = new Set(schemaObject.columns.map((column) => column.name));
  const compatible = current.filter((column) => columns.has(column));
  return compatible.length ? compatible : defaultPrimaryKey(schemaObject);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteQualifiedAlias(expression: string, oldAlias: string, newAlias: string): string {
  if (!oldAlias || !newAlias || oldAlias === newAlias) {
    return expression;
  }
  return expression.replace(new RegExp(`(^|[^a-zA-Z0-9_])${escapeRegExp(oldAlias)}\\.`, "g"), `$1${newAlias}.`);
}

function replaceConnectionReferences(model: DataModelDefinition, oldConnectionId: string, newConnectionId: string): DataModelDefinition {
  return {
    ...model,
    sources: model.sources.map((source) => (source.connection_id === oldConnectionId ? { ...source, connection_id: newConnectionId } : source)),
    fact_table: model.fact_table?.connection_id === oldConnectionId ? { ...model.fact_table, connection_id: newConnectionId } : model.fact_table,
    dimensions: model.dimensions.map((dimension) =>
      dimension.connection_id === oldConnectionId ? { ...dimension, connection_id: newConnectionId } : dimension
    )
  };
}

function diagnosticConnectionId(diagnostic: DataModelDiagnostic): string | null {
  if (diagnostic.code !== "missing_connection" || !diagnostic.location) {
    return null;
  }
  const value = diagnostic.location.connection_id;
  return typeof value === "string" ? value : null;
}

function BuilderSection({ children, defaultOpen = true, number, state, stateTone, summary, title }: BuilderSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <details className="rv-data-model-builder__section" onToggle={(event) => setOpen(event.currentTarget.open)} open={open}>
      <summary className="rv-data-model-builder__section-header">
        <span className="rv-data-model-builder__section-number">{number}</span>
        <span className="rv-data-model-builder__section-heading">
          <strong>{title}</strong>
          <small>{summary}</small>
        </span>
        <span className="rv-data-model-builder__section-state" data-tone={stateTone ?? "neutral"}>
          {state}
        </span>
        <span aria-hidden="true" className="rv-data-model-builder__section-chevron">
          ▾
        </span>
      </summary>
      <div className="rv-data-model-builder__section-body">{children}</div>
    </details>
  );
}

export function DataModelBuilder({ modelId, onDataModelDropped, onDataModelSaved }: DataModelBuilderProps) {
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [currentModelId, setCurrentModelId] = useState(modelId ?? "");
  const [description, setDescription] = useState("");
  const [diagnostics, setDiagnostics] = useState<DataModelDiagnostic[]>([]);
  const [draft, setDraft] = useState<DataModelDefinition>(emptyModel);
  const [draftTestNotice, setDraftTestNotice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [modelLoadRevision, setModelLoadRevision] = useState(0);
  const [modelLoading, setModelLoading] = useState(Boolean(modelId));
  const [modelName, setModelName] = useState("");
  const [newSourceConnectionId, setNewSourceConnectionId] = useState("");
  const [replacementConnections, setReplacementConnections] = useState<Record<string, string>>({});
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [schemaByConnection, setSchemaByConnection] = useState<Record<string, SchemaState>>({});
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);
  const [suggestionTargetSelections, setSuggestionTargetSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<"drop" | "repair" | "save" | "test" | null>(null);
  const [testStatus, setTestStatus] = useState<DataModelStatus>("draft");
  const aliasOrigins = useRef<Record<string, string>>({});
  const draftRevision = useRef(0);
  const saveRevision = useRef(0);
  const requestedSchemas = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    setConnectionsLoading(true);
    listConnections()
      .then((response) => {
        if (active) {
          setConnections(response.connections);
        }
      })
      .catch(() => {
        if (active) {
          setFeedback("Connections could not be loaded.");
        }
      })
      .finally(() => {
        if (active) {
          setConnectionsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setCurrentModelId(modelId ?? "");
    setDiagnostics([]);
    setDraftTestNotice(null);
    setFeedback(null);
    setModelLoadError(false);
    setReplacementConnections({});
    setSelectedSuggestionIds([]);
    setSuggestionTargetSelections({});
    setSchemaByConnection({});
    requestedSchemas.current.clear();
    aliasOrigins.current = {};

    if (!modelId) {
      setDescription("");
      setDraft(emptyModel());
      setModelLoading(false);
      setModelName("");
      setSavedSnapshot(null);
      setTestStatus("draft");
      return () => {
        active = false;
      };
    }

    setModelLoading(true);
    getDataModel(modelId)
      .then((saved) => {
        if (active) {
          applySavedModel(saved);
        }
      })
      .catch(() => {
        if (active) {
          setModelLoadError(true);
        }
      })
      .finally(() => {
        if (active) {
          setModelLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [modelId, modelLoadRevision]);

  const referencedConnectionKey = useMemo(() => {
    const connectionIds = [
      ...draft.sources.map((source) => source.connection_id),
      ...(draft.fact_table ? [draft.fact_table.connection_id] : []),
      ...draft.dimensions.map((dimension) => dimension.connection_id)
    ];
    return [...new Set(connectionIds.filter(Boolean))].sort().join("|");
  }, [draft]);

  useEffect(() => {
    const connectionIds = referencedConnectionKey.split("|").filter(Boolean);
    connectionIds.forEach((connectionId) => {
      if (requestedSchemas.current.has(connectionId)) {
        return;
      }
      requestedSchemas.current.add(connectionId);
      setSchemaByConnection((current) => ({ ...current, [connectionId]: { error: null, loading: true, objects: [] } }));
      inspectConnectionSchema(connectionId)
        .then((schema) => {
          setSchemaByConnection((current) => ({ ...current, [connectionId]: { error: null, loading: false, objects: schema.objects } }));
        })
        .catch((error) => {
          requestedSchemas.current.delete(connectionId);
          setSchemaByConnection((current) => ({
            ...current,
            [connectionId]: { error: schemaErrorMessage(error), loading: false, objects: [] }
          }));
        });
    });
  }, [referencedConnectionKey]);

  const connectionById = useMemo(() => new Map(connections.map((connection) => [connection.id, connection])), [connections]);
  const availableConnections = connections.filter((connection) => !draft.sources.some((source) => source.connection_id === connection.id));
  const dirty = currentModelId ? savedSnapshot !== modelSnapshot(modelName, description, draft) : true;
  const missingConnectionIds = [...new Set(diagnostics.filter((item) => !item.stale).map(diagnosticConnectionId).filter((value): value is string => Boolean(value)))];
  const tablesById = useMemo(() => new Map(modelTables(draft).map((table) => [table.id, table])), [draft]);
  const connectedIds = useMemo(() => connectedTableIds(draft), [draft]);
  const { items: relationshipSuggestions, capOmitted: relationshipSuggestionsOmitted } = useMemo(() => {
    if (!draft.fact_table?.table) {
      return { items: [], capOmitted: false };
    }
    const incomingIds = new Set(draft.relationships.map((relationship) => relationship.child_table_id));
    const reservedReusableIds = new Set<string>();
    const seenSuggestionIds = new Set<string>();
    const suggestions: RelationshipSuggestion[] = [];
    let capOmitted = false;
    let proposedDimensions = 0;
    const pending: Array<{
      instanceId: string;
      parentSuggestionId: string | null;
      connectionId: string;
      table: string;
      depth: number;
      path: Set<string>;
    }> = [{
      instanceId: draft.fact_table.id,
      parentSuggestionId: null,
      connectionId: draft.fact_table.connection_id,
      table: draft.fact_table.table,
      depth: 0,
      path: new Set([`${draft.fact_table.connection_id}|${draft.fact_table.table}`])
    }];

    while (pending.length) {
      const parent = pending.shift();
      if (!parent) {
        continue;
      }
      const parentObject = schemaByConnection[parent.connectionId]?.objects.find((item) => item.name === parent.table);
      const foreignKeys = [...(parentObject?.foreign_keys ?? [])].sort((left, right) => left.referenced_table.localeCompare(right.referenced_table));
      if (parent.depth >= MAX_DIMENSIONS) {
        capOmitted ||= foreignKeys.length > 0;
        continue;
      }
      foreignKeys.forEach((foreignKey) => {
        if (suggestions.length >= MAX_DIMENSIONS) {
          capOmitted = true;
          return;
        }
        const physicalTarget = `${parent.connectionId}|${foreignKey.referenced_table}`;
        if (parent.path.has(physicalTarget)) {
          return;
        }
        const existingRelationship = parent.instanceId
          ? draft.relationships.find((relationship) => {
              const child = tablesById.get(relationship.child_table_id);
              return relationship.parent_table_id === parent.instanceId
                && child?.connection_id === parent.connectionId
                && child.table === foreignKey.referenced_table;
            })
          : undefined;
        if (existingRelationship) {
          const child = tablesById.get(existingRelationship.child_table_id);
          if (child) {
            pending.push({
              instanceId: child.id,
              parentSuggestionId: parent.parentSuggestionId,
              connectionId: child.connection_id,
              table: child.table,
              depth: parent.depth + 1,
              path: new Set([...parent.path, physicalTarget])
            });
          }
          return;
        }

        const pairs = foreignKey.column_pairs.map((pair) => ({
          parent_column: pair.local_column,
          child_column: pair.referenced_column
        }));
        const suggestionId = `${parent.parentSuggestionId ?? parent.instanceId}|${parent.table}|${foreignKey.referenced_table}|${pairs.map((pair) => `${pair.parent_column}:${pair.child_column}`).join(",")}`;
        if (seenSuggestionIds.has(suggestionId)) {
          return;
        }
        const reusableDimensions = draft.dimensions.filter(
          (dimension) => dimension.connection_id === parent.connectionId
            && dimension.table === foreignKey.referenced_table
            && !incomingIds.has(dimension.id)
            && !reservedReusableIds.has(dimension.id)
        );
        const reusableDimension = reusableDimensions.length === 1 ? reusableDimensions[0] : undefined;
        if (!reusableDimensions.length && draft.dimensions.length + proposedDimensions >= MAX_DIMENSIONS) {
          capOmitted = true;
          return;
        }
        seenSuggestionIds.add(suggestionId);
        if (reusableDimension) {
          reservedReusableIds.add(reusableDimension.id);
        } else if (!reusableDimensions.length) {
          proposedDimensions += 1;
        }
        suggestions.push({
          id: suggestionId,
          parentTableId: parent.instanceId,
          parentSuggestionId: parent.parentSuggestionId,
          childTableId: reusableDimension?.id ?? null,
          parentTable: parent.table,
          referencedTable: foreignKey.referenced_table,
          connectionId: parent.connectionId,
          depth: parent.depth + 1,
          columnPairs: pairs,
          reusableTableIds: reusableDimensions.map((dimension) => dimension.id)
        });
        pending.push({
          instanceId: reusableDimension?.id ?? "",
          parentSuggestionId: suggestionId,
          connectionId: parent.connectionId,
          table: foreignKey.referenced_table,
          depth: parent.depth + 1,
          path: new Set([...parent.path, physicalTarget])
        });
      });
    }
    return {
      items: suggestions.sort((left, right) => left.depth - right.depth || `${left.parentTable}.${left.referencedTable}`.localeCompare(`${right.parentTable}.${right.referencedTable}`)),
      capOmitted
    };
  }, [draft, schemaByConnection, tablesById]);
  useEffect(() => {
    const availableIds = new Set(relationshipSuggestions.map((suggestion) => suggestion.id));
    setSelectedSuggestionIds((current) => current.filter((id) => availableIds.has(id)));
    setSuggestionTargetSelections((current) => Object.fromEntries(
      Object.entries(current).filter(([id]) => availableIds.has(id))
    ));
  }, [relationshipSuggestions]);
  const modelMapRows = useMemo(() => {
    const rows: Array<{ relationship: DataModelRelationship; depth: number }> = [];
    if (!draft.fact_table) {
      return rows;
    }
    const byParent = new Map<string, DataModelRelationship[]>();
    draft.relationships.forEach((relationship) => {
      const current = byParent.get(relationship.parent_table_id) ?? [];
      current.push(relationship);
      byParent.set(relationship.parent_table_id, current);
    });
    const visit = (parentId: string, depth: number, seen: Set<string>) => {
      (byParent.get(parentId) ?? []).forEach((relationship) => {
        if (seen.has(relationship.child_table_id)) {
          return;
        }
        rows.push({ relationship, depth });
        visit(relationship.child_table_id, depth + 1, new Set([...seen, relationship.child_table_id]));
      });
    };
    visit(draft.fact_table.id, 0, new Set([draft.fact_table.id]));
    return rows;
  }, [draft]);
  const completenessGaps = useMemo(() => {
    const gaps: string[] = [];
    const findSchemaObject = (connectionId: string, table: string) => schemaByConnection[connectionId]?.objects.find((item) => item.name === table);
    if (!draft.sources.length) {
      gaps.push("Add at least one source connection before testing.");
    }
    if (!draft.fact_table?.table) {
      gaps.push("Select one fact table before testing.");
    } else {
      const factSchema = schemaByConnection[draft.fact_table.connection_id];
      const factObject = findSchemaObject(draft.fact_table.connection_id, draft.fact_table.table);
      if (factSchema?.error) {
        gaps.push("Reload the fact source schema before testing.");
      } else if (factSchema && !factSchema.loading && !factObject) {
        gaps.push(`Repair the unavailable fact object ${draft.fact_table.table}.`);
      }
      if (!draft.fact_table.alias.trim() || !draft.fact_table.primary_key.length) {
        gaps.push("Complete the fact alias and primary key.");
      } else if (factObject && draft.fact_table.primary_key.some((column) => !factObject.columns.some((item) => item.name === column))) {
        gaps.push("Repair unavailable fact primary-key columns.");
      }
    }
    draft.dimensions.forEach((dimension, index) => {
      const dimensionSchema = schemaByConnection[dimension.connection_id];
      const dimensionObject = findSchemaObject(dimension.connection_id, dimension.table);
      if (!dimension.table || !dimension.alias.trim() || !dimension.primary_key.length) {
        gaps.push(`Complete dimension ${index + 1}.`);
      } else if (dimensionSchema?.error) {
        gaps.push(`Reload the schema for ${dimension.alias || `dimension ${index + 1}`}.`);
      } else if (dimensionSchema && !dimensionSchema.loading && !dimensionObject) {
        gaps.push(`Repair the unavailable object for ${dimension.alias || `dimension ${index + 1}`}.`);
      } else if (dimensionObject && dimension.primary_key.some((column) => !dimensionObject.columns.some((item) => item.name === column))) {
        gaps.push(`Repair unavailable primary-key columns for ${dimension.alias || `dimension ${index + 1}`}.`);
      }
      if (!draft.relationships.some((relationship) => relationship.child_table_id === dimension.id)) {
        gaps.push(`Connect ${dimension.alias || `dimension ${index + 1}`} to the model root.`);
      } else if (!connectedIds.has(dimension.id)) {
        gaps.push(`Repair the disconnected path for ${dimension.alias || `dimension ${index + 1}`}.`);
      }
    });
    draft.relationships.forEach((relationship) => {
      const parent = tablesById.get(relationship.parent_table_id);
      const child = tablesById.get(relationship.child_table_id);
      if (!parent || !child) {
        gaps.push("Repair a relationship with an unavailable table endpoint.");
        return;
      }
      if (!relationship.key_pairs.length || relationship.key_pairs.some((pair) => !pair.parent_column || !pair.child_column)) {
        gaps.push(`Complete join keys for ${child.alias || "a dimension"}.`);
        return;
      }
      const parentColumns = new Set(findSchemaObject(parent.connection_id, parent.table)?.columns.map((column) => column.name) ?? []);
      const childColumns = new Set(findSchemaObject(child.connection_id, child.table)?.columns.map((column) => column.name) ?? []);
      if (relationship.key_pairs.some((pair) => !parentColumns.has(pair.parent_column) || !childColumns.has(pair.child_column))) {
        gaps.push(`Repair unavailable join columns for ${child.alias || "a dimension"}.`);
      }
    });
    draft.business_rules.forEach((rule, index) => {
      if (!rule.name.trim() || !rule.expression.trim()) {
        gaps.push(`Complete business rule ${index + 1}.`);
      }
    });
    return gaps;
  }, [connectedIds, draft, schemaByConnection, tablesById]);

  function schemaObjects(connectionId: string): DataModelSchemaObject[] {
    return schemaByConnection[connectionId]?.objects ?? [];
  }

  function schemaObject(connectionId: string, table: string): DataModelSchemaObject | undefined {
    return schemaObjects(connectionId).find((item) => item.name === table);
  }

  function retrySchemaMetadata(connectionId: string) {
    requestedSchemas.current.add(connectionId);
    setSchemaByConnection((current) => ({ ...current, [connectionId]: { error: null, loading: true, objects: [] } }));
    inspectConnectionSchema(connectionId)
      .then((schema) => {
        setSchemaByConnection((current) => ({ ...current, [connectionId]: { error: null, loading: false, objects: schema.objects } }));
      })
      .catch((error) => {
        requestedSchemas.current.delete(connectionId);
        setSchemaByConnection((current) => ({
          ...current,
          [connectionId]: { error: schemaErrorMessage(error), loading: false, objects: [] }
        }));
      });
  }

  function applySavedModel(saved: SavedDataModel) {
    draftRevision.current += 1;
    saveRevision.current += 1;
    setCurrentModelId(saved.id);
    setModelName(saved.name);
    setDescription(saved.description ?? "");
    setDraft(saved.model);
    setTestStatus(saved.test_status);
    setDiagnostics([...saved.last_test_errors, ...saved.last_test_warnings]);
    setSavedSnapshot(modelSnapshot(saved.name, saved.description ?? "", saved.model));
    setDraftTestNotice(null);
    setReplacementConnections({});
    aliasOrigins.current = {};
  }

  function mutateDraft(update: (current: DataModelDefinition) => DataModelDefinition) {
    draftRevision.current += 1;
    saveRevision.current += 1;
    setDraft(update);
    setDraftTestNotice(null);
    setFeedback(null);
    setDiagnostics((current) => currentModelId ? current.map((item) => ({ ...item, stale: true })) : []);
  }

  async function handleTest() {
    const testedRevision = draftRevision.current;
    const testedDraft = draft;
    setSubmitting("test");
    setFeedback(null);
    setDraftTestNotice(null);
    try {
      const testsDraft = !currentModelId || dirty;
      const result = testsDraft ? await testUnsavedDataModel({ model: testedDraft }) : await testSavedDataModel(currentModelId);
      if (draftRevision.current !== testedRevision) {
        setFeedback("The definition changed during testing. Run Test model again for current results.");
        return;
      }
      setDiagnostics([...result.errors, ...result.warnings]);
      if (testsDraft) {
        setDraftTestNotice(
          result.succeeded
            ? "Draft test passed. Save and retest to persist the tested status."
            : "Draft test results are not persisted until this definition is saved and retested."
        );
      } else {
        setTestStatus(result.status);
      }
      setFeedback(result.succeeded ? "Data model test succeeded." : "Data model test returned diagnostics.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Data model test failed.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleSave() {
    const savedRevision = saveRevision.current;
    const submittedSnapshot = modelSnapshot(modelName, description, draft);
    setSubmitting("save");
    setFeedback(null);
    try {
      const saved = currentModelId
        ? await updateDataModel(currentModelId, { name: modelName, description, model: draft })
        : await createDataModel({ name: modelName, description, model: draft });
      if (saveRevision.current === savedRevision) {
        applySavedModel(saved);
        setFeedback("Data model saved.");
      } else {
        setCurrentModelId(saved.id);
        setModelName(saved.name);
        setSavedSnapshot(submittedSnapshot);
        setTestStatus(saved.test_status);
        setDiagnostics([...saved.last_test_errors, ...saved.last_test_warnings].map((item) => ({ ...item, stale: true })));
        setFeedback("Data model saved. Newer edits remain unsaved.");
      }
      onDataModelSaved?.(saved);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Data model could not be saved.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleRepairSource(oldConnectionId: string) {
    const replacementConnectionId = replacementConnections[oldConnectionId];
    if (!currentModelId || !replacementConnectionId) {
      return;
    }
    const repairedModel = replaceConnectionReferences(draft, oldConnectionId, replacementConnectionId);
    mutateDraft(() => repairedModel);
    const repairRevision = saveRevision.current;
    const repairedSnapshot = modelSnapshot(modelName, description, repairedModel);
    setSubmitting("repair");
    try {
      const saved = await updateDataModel(currentModelId, { name: modelName, description, model: repairedModel });
      if (saveRevision.current === repairRevision) {
        applySavedModel(saved);
        setFeedback("Source repaired. Review preserved configuration before retesting.");
      } else {
        setSavedSnapshot(repairedSnapshot);
        setTestStatus(saved.test_status);
        setDiagnostics([...saved.last_test_errors, ...saved.last_test_warnings].map((item) => ({ ...item, stale: true })));
        setFeedback("Source repaired. Newer edits remain unsaved; review the preserved configuration before retesting.");
      }
      onDataModelSaved?.(saved);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Source could not be repaired.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDrop() {
    if (!currentModelId || !window.confirm("Drop this data model? Source connections and files will not be deleted.")) {
      return;
    }
    setSubmitting("drop");
    setFeedback(null);
    try {
      await deleteDataModel(currentModelId);
      onDataModelDropped?.(currentModelId);
      setFeedback("Data model dropped.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Data model could not be dropped.");
    } finally {
      setSubmitting(null);
    }
  }

  function handleAddSource() {
    const connection = connectionById.get(newSourceConnectionId);
    if (!connection || draft.sources.length >= MAX_SOURCES) {
      return;
    }
    mutateDraft((current) => ({
      ...current,
      sources: [...current.sources, { connection_id: connection.id, alias: aliasFor("src", connection.label), metadata: {} }]
    }));
    setNewSourceConnectionId("");
  }

  function handleRemoveSource(connectionId: string) {
    const affectedIds = new Set([
      ...(draft.fact_table?.connection_id === connectionId ? [draft.fact_table.id] : []),
      ...draft.dimensions.filter((dimension) => dimension.connection_id === connectionId).map((dimension) => dimension.id)
    ]);
    const removesFact = Boolean(draft.fact_table && affectedIds.has(draft.fact_table.id));
    if (
      affectedIds.size
      && !window.confirm(
        removesFact
          ? "Remove this fact source and its affected tables? The connected tree may be removed. Business rules will be preserved for repair."
          : "Remove this source and its affected dimensions? Business rules will be preserved for repair."
      )
    ) {
      return;
    }
    const descendantIds = new Set<string>();
    affectedIds.forEach((tableId) => {
      descendantTableIds(draft, tableId).forEach((descendantId) => descendantIds.add(descendantId));
    });
    const unaffectedDescendants = [...descendantIds].filter((tableId) => !affectedIds.has(tableId));
    const removeDescendantBranches = unaffectedDescendants.length
      ? window.confirm(
          "Remove affected descendant branches too? Select OK to remove them, or Cancel to preserve other-source descendants for reattachment."
        )
      : false;
    mutateDraft((current) => ({
      ...(() => {
        const removedIds = new Set([
          ...(current.fact_table?.connection_id === connectionId ? [current.fact_table.id] : []),
          ...current.dimensions.filter((dimension) => dimension.connection_id === connectionId).map((dimension) => dimension.id),
          ...(removeDescendantBranches ? unaffectedDescendants : [])
        ]);
        return {
          ...current,
          sources: current.sources.filter((source) => source.connection_id !== connectionId),
          fact_table: current.fact_table && removedIds.has(current.fact_table.id) ? null : current.fact_table,
          dimensions: current.dimensions.filter((dimension) => !removedIds.has(dimension.id)),
          relationships: current.relationships.filter(
            (relationship) => !removedIds.has(relationship.parent_table_id) && !removedIds.has(relationship.child_table_id)
          )
        };
      })()
    }));
  }

  function handleFactSource(connectionId: string) {
    if (!connectionId) {
      mutateDraft((current) => ({
        ...current,
        fact_table: null,
        relationships: current.fact_table
          ? current.relationships.filter(
              (relationship) => relationship.parent_table_id !== current.fact_table?.id && relationship.child_table_id !== current.fact_table?.id
            )
          : current.relationships
      }));
      return;
    }
    mutateDraft((current) => {
      if (!current.fact_table) {
        return {
          ...current,
          fact_table: {
            id: itemId("fact"),
            connection_id: connectionId,
            table: "",
            object_type: "table",
            alias: "",
            grain: null,
            primary_key: [],
            metadata: {}
          }
        };
      }
      const selectedObject = schemaObject(connectionId, current.fact_table.table);
      return {
        ...current,
        fact_table: {
          ...current.fact_table,
          connection_id: connectionId,
          object_type: selectedObject?.object_type ?? current.fact_table.object_type,
          primary_key: compatiblePrimaryKey(current.fact_table.primary_key, selectedObject)
        }
      };
    });
  }

  function handleFactTable(table: string) {
    mutateDraft((current) => {
      if (!current.fact_table) {
        return current;
      }
      const selectedObject = schemaObject(current.fact_table.connection_id, table);
      return {
        ...current,
        fact_table: {
          ...current.fact_table,
          table,
          object_type: selectedObject?.object_type ?? "table",
          alias: current.fact_table.alias || aliasFor("fact", table),
          primary_key: compatiblePrimaryKey(current.fact_table.primary_key, selectedObject)
        }
      };
    });
  }

  function handleAliasChange(kind: "fact" | string, oldAlias: string, newAlias: string) {
    if (!aliasOrigins.current[kind] && oldAlias) {
      aliasOrigins.current[kind] = oldAlias;
    }
    const origin = aliasOrigins.current[kind] ?? oldAlias;
    if (newAlias.trim()) {
      aliasOrigins.current[kind] = newAlias;
    }
    mutateDraft((current) => ({
      ...current,
      fact_table: kind === "fact" && current.fact_table ? { ...current.fact_table, alias: newAlias } : current.fact_table,
      dimensions: current.dimensions.map((dimension) => (dimension.id === kind ? { ...dimension, alias: newAlias } : dimension)),
      business_rules: newAlias.trim()
        ? current.business_rules.map((rule) => ({ ...rule, expression: rewriteQualifiedAlias(rule.expression, origin, newAlias) }))
        : current.business_rules
    }));
  }

  function handleAddDimension() {
    if (!draft.sources.length || draft.dimensions.length >= MAX_DIMENSIONS) {
      return;
    }
    const source = draft.sources[0];
    const dimensionId = itemId("dim");
    mutateDraft((current) => ({
      ...current,
      dimensions: [
        ...current.dimensions,
        {
          id: dimensionId,
          connection_id: source.connection_id,
          table: "",
          object_type: "table",
          alias: "",
          primary_key: [],
          metadata: {}
        }
      ]
    }));
  }

  function handleDimensionSource(dimensionId: string, connectionId: string) {
    mutateDraft((current) => ({
      ...current,
      dimensions: current.dimensions.map((dimension) =>
        dimension.id === dimensionId
          ? (() => {
              const selectedObject = schemaObject(connectionId, dimension.table);
              return {
                ...dimension,
                connection_id: connectionId,
                object_type: selectedObject?.object_type ?? dimension.object_type,
                primary_key: compatiblePrimaryKey(dimension.primary_key, selectedObject)
              };
            })()
          : dimension
      )
    }));
  }

  function handleDimensionTable(dimensionId: string, table: string) {
    mutateDraft((current) => ({
      ...current,
      dimensions: current.dimensions.map((dimension) => {
        if (dimension.id !== dimensionId) {
          return dimension;
        }
        const selectedObject = schemaObject(dimension.connection_id, table);
        return {
          ...dimension,
          table,
          object_type: selectedObject?.object_type ?? "table",
          alias: dimension.alias || aliasFor("dim", table),
          primary_key: compatiblePrimaryKey(dimension.primary_key, selectedObject)
        };
      })
    }));
  }

  function handleRemoveDimension(dimensionId: string) {
    const dimension = draft.dimensions.find((item) => item.id === dimensionId);
    if (!dimension || !window.confirm(`Remove ${dimension.alias || dimension.table || "this dimension"}? Business rules will be preserved for repair.`)) {
      return;
    }
    const descendantIds = descendantTableIds(draft, dimensionId);
    const removeDescendantBranch = descendantIds.size
      ? window.confirm(
          "Remove this dimension's descendant branch too? Select OK to remove it, or Cancel to preserve descendants for reattachment."
        )
      : false;
    mutateDraft((current) => ({
      ...current,
      dimensions: current.dimensions.filter(
        (item) => item.id !== dimensionId && !(removeDescendantBranch && descendantIds.has(item.id))
      ),
      relationships: current.relationships.filter(
        (relationship) => {
          const removedIds = new Set([dimensionId, ...(removeDescendantBranch ? descendantIds : [])]);
          return !removedIds.has(relationship.parent_table_id) && !removedIds.has(relationship.child_table_id);
        }
      )
    }));
  }

  function updateRelationship(relationshipId: string, update: (relationship: DataModelRelationship) => DataModelRelationship) {
    mutateDraft((current) => ({
      ...current,
      relationships: current.relationships.map((relationship) => (relationship.id === relationshipId ? update(relationship) : relationship))
    }));
  }

  function handleRelationshipEndpointChange(
    relationship: DataModelRelationship,
    endpoint: "parent_table_id" | "child_table_id",
    tableId: string
  ) {
    const parentTableId = endpoint === "parent_table_id" ? tableId : relationship.parent_table_id;
    const childTableId = endpoint === "child_table_id" ? tableId : relationship.child_table_id;
    const parent = tablesById.get(parentTableId);
    const child = tablesById.get(childTableId);
    const parentObject = schemaObject(parent?.connection_id ?? "", parent?.table ?? "");
    const childObject = schemaObject(child?.connection_id ?? "", child?.table ?? "");
    const compatibleKeyPairs = !parentTableId || !childTableId
      ? []
      : parentObject && childObject
        ? relationship.key_pairs.filter(
            (pair) => parentObject.columns.some((column) => column.name === pair.parent_column)
              && childObject.columns.some((column) => column.name === pair.child_column)
          )
        : relationship.key_pairs;
    updateRelationship(relationship.id, (current) => ({
      ...current,
      [endpoint]: tableId,
      key_pairs: compatibleKeyPairs,
      metadata: { ...current.metadata, origin: "manual" }
    }));
    if (compatibleKeyPairs.length < relationship.key_pairs.length) {
      setFeedback("Incompatible relationship key pairs were cleared after the endpoint changed.");
    }
  }

  function handleAddKeyPair(relationship: DataModelRelationship) {
    const parent = tablesById.get(relationship.parent_table_id);
    const child = tablesById.get(relationship.child_table_id);
    const parentColumns = schemaObject(parent?.connection_id ?? "", parent?.table ?? "")?.columns ?? [];
    const childColumns = schemaObject(child?.connection_id ?? "", child?.table ?? "")?.columns ?? [];
    const pair = {
      parent_column: parentColumns.find((column) => !relationship.key_pairs.some((item) => item.parent_column === column.name))?.name ?? parentColumns[0]?.name ?? "",
      child_column: childColumns.find((column) => !relationship.key_pairs.some((item) => item.child_column === column.name))?.name ?? childColumns[0]?.name ?? ""
    };
    updateRelationship(relationship.id, (current) => ({ ...current, key_pairs: [...current.key_pairs, pair] }));
  }

  function handleAddRelationship() {
    if (!draft.fact_table) {
      return;
    }
    const incomingIds = new Set(draft.relationships.map((relationship) => relationship.child_table_id));
    const child = draft.dimensions.find((dimension) => !incomingIds.has(dimension.id));
    if (!child) {
      return;
    }
    mutateDraft((current) => ({
      ...current,
      relationships: [
        ...current.relationships,
        {
          id: itemId("rel"),
          parent_table_id: current.fact_table?.id ?? "",
          child_table_id: child.id,
          join_type: "left",
          key_pairs: [],
          metadata: { origin: "manual" }
        }
      ]
    }));
  }

  function suggestionClosure(suggestionIds: string[]): RelationshipSuggestion[] {
    const byId = new Map(relationshipSuggestions.map((suggestion) => [suggestion.id, suggestion]));
    const included = new Set<string>();
    const include = (suggestionId: string) => {
      const suggestion = byId.get(suggestionId);
      if (!suggestion || included.has(suggestionId)) {
        return;
      }
      if (suggestion.parentSuggestionId) {
        include(suggestion.parentSuggestionId);
      }
      included.add(suggestionId);
    };
    suggestionIds.forEach(include);
    return relationshipSuggestions.filter((suggestion) => included.has(suggestion.id));
  }

  function handleToggleSuggestion(suggestionId: string, checked: boolean) {
    setSelectedSuggestionIds((current) => {
      if (checked) {
        return [...new Set([...current, ...suggestionClosure([suggestionId]).map((suggestion) => suggestion.id)])];
      }
      return current.filter(
        (selectedId) => !suggestionClosure([selectedId]).some((suggestion) => suggestion.id === suggestionId)
      );
    });
  }

  function handleAcceptSuggestions(suggestionIds: string[]) {
    const selected = suggestionClosure(suggestionIds);
    if (!selected.length) {
      return;
    }
    if (selected.some(
      (suggestion) => suggestion.reusableTableIds.length > 1 && !suggestionTargetSelections[suggestion.id]
    )) {
      setFeedback("Choose a target alias for every ambiguous detected relationship.");
      return;
    }
    mutateDraft((current) => {
      let next = current;
      const createdBySuggestion = new Map<string, string>();
      for (const suggestion of selected) {
        const parentId = suggestion.parentTableId || (suggestion.parentSuggestionId ? createdBySuggestion.get(suggestion.parentSuggestionId) ?? "" : "");
        const nextTables = new Map(modelTables(next).map((table) => [table.id, table]));
        const schemaTarget = schemaObject(suggestion.connectionId, suggestion.referencedTable);
        if (!parentId || !nextTables.has(parentId) || !schemaTarget) {
          return current;
        }
        const incomingIds = new Set(next.relationships.map((relationship) => relationship.child_table_id));
        const reusableCandidates = next.dimensions.filter(
          (dimension) => dimension.connection_id === suggestion.connectionId
            && dimension.table === suggestion.referencedTable
            && !incomingIds.has(dimension.id)
        );
        const targetSelection = suggestionTargetSelections[suggestion.id];
        const selectedReusable = targetSelection && targetSelection !== "new"
          ? reusableCandidates.find((dimension) => dimension.id === targetSelection)
          : undefined;
        if (targetSelection && targetSelection !== "new" && !selectedReusable) {
          return current;
        }
        const reusable = selectedReusable
          ?? (!targetSelection && suggestion.childTableId
            ? next.dimensions.find((dimension) => dimension.id === suggestion.childTableId)
            : undefined)
          ?? (!targetSelection && reusableCandidates.length === 1 ? reusableCandidates[0] : undefined);
        if (!reusable && next.dimensions.length >= MAX_DIMENSIONS) {
          return current;
        }
        const child = reusable ?? {
          id: itemId("dim"),
          connection_id: suggestion.connectionId,
          table: suggestion.referencedTable,
          object_type: schemaTarget.object_type,
          alias: uniqueDimensionAlias(next, suggestion.referencedTable),
          primary_key: defaultPrimaryKey(schemaTarget),
          metadata: {}
        };
        createdBySuggestion.set(suggestion.id, child.id);
        next = {
          ...next,
          dimensions: reusable ? next.dimensions : [...next.dimensions, child],
          relationships: [
            ...next.relationships,
            {
              id: itemId("rel"),
              parent_table_id: parentId,
              child_table_id: child.id,
              join_type: "left",
              key_pairs: suggestion.columnPairs,
              metadata: {
                origin: "foreign_key",
                foreign_key: {
                  connection_id: suggestion.connectionId,
                  local_table: suggestion.parentTable,
                  referenced_table: suggestion.referencedTable,
                  column_pairs: suggestion.columnPairs.map((pair) => ({
                    local_column: pair.parent_column,
                    referenced_column: pair.child_column
                  }))
                }
              }
            }
          ]
        };
      }
      return next;
    });
    setSelectedSuggestionIds([]);
  }

  function handleAddRule() {
    if (draft.business_rules.length >= MAX_BUSINESS_RULES) {
      return;
    }
    mutateDraft((current) => ({
      ...current,
      business_rules: [
        ...current.business_rules,
        {
          id: itemId("rule"),
          name: (() => {
            const names = new Set(current.business_rules.map((rule) => rule.name.trim().toLowerCase()));
            let index = 1;
            while (names.has(`business_rule_${index}`)) {
              index += 1;
            }
            return `business_rule_${index}`;
          })(),
          expression: "",
          output_type: "unknown",
          metadata: {}
        }
      ]
    }));
  }

  function updateRule(ruleId: string, update: Partial<DataModelBusinessRule>) {
    mutateDraft((current) => ({
      ...current,
      business_rules: current.business_rules.map((rule) => (rule.id === ruleId ? { ...rule, ...update } : rule))
    }));
  }

  if (modelLoading) {
    return (
      <div className="rv-data-model-builder rv-data-model-builder--loading" data-testid="data-model-builder">
        <p className="rv-data-model-builder__eyebrow">Analytical data model</p>
        <h2>Loading data model...</h2>
        <div aria-label="Loading saved data model" className="rv-data-model-builder__loading-card" role="status" />
      </div>
    );
  }

  if (modelLoadError) {
    return (
      <div className="rv-data-model-builder rv-data-model-builder--loading" data-testid="data-model-builder">
        <p className="rv-data-model-builder__eyebrow">Analytical data model</p>
        <h2>Data model could not be loaded</h2>
        <p>The saved definition is unavailable. Retry before editing or dropping this model.</p>
        <button
          className="rv-data-model-builder__secondary-button"
          onClick={() => {
            setModelLoadError(false);
            setModelLoading(true);
            setModelLoadRevision((current) => current + 1);
          }}
          type="button"
        >
          Retry loading data model
        </button>
      </div>
    );
  }

  const statusLabel = draftTestNotice ? `Draft test · ${diagnostics.some((item) => item.severity === "error") ? "issues" : "passed"}` : testStatus;
  const statusTone = draftTestNotice ? (diagnostics.some((item) => item.severity === "error") ? "failed" : "tested") : testStatus;
  const submittingAny = submitting !== null;
  const factSchemaState = draft.fact_table ? schemaByConnection[draft.fact_table.connection_id] : undefined;
  const factConnectionLabel = draft.fact_table ? connectionById.get(draft.fact_table.connection_id)?.label ?? draft.fact_table.connection_id : "source";

  return (
    <div className="rv-data-model-builder" data-testid="data-model-builder">
      <header className="rv-data-model-builder__header">
        <div>
          <p className="rv-data-model-builder__eyebrow">Analytical data model</p>
          <div className="rv-data-model-builder__title-row">
            <h2>{currentModelId && modelName ? modelName : "New data model"}</h2>
            {currentModelId ? <span className="rv-data-model-builder__locked">Name locked</span> : null}
          </div>
          <p>Build a fact-rooted dimensional model from saved SQLite connections, then validate it with a zero-row compile test.</p>
        </div>
        <div className="rv-data-model-builder__status-block">
          <span className="rv-data-model-builder__status" data-status={statusTone}>
            {statusLabel}
          </span>
          <small>{dirty && currentModelId ? "Draft changes not saved" : currentModelId ? "Saved definition" : "Unsaved draft"}</small>
        </div>
      </header>

      <div className="rv-data-model-builder__health" aria-label="Model health">
        <div><span>Sources</span><strong>{draft.sources.length} / {MAX_SOURCES}</strong></div>
        <div><span>Dimensions</span><strong>{draft.dimensions.length} / {MAX_DIMENSIONS}</strong></div>
        <div><span>Business rules</span><strong>{draft.business_rules.length} / {MAX_BUSINESS_RULES}</strong></div>
        <div><span>Draft checks</span><strong data-tone={completenessGaps.length ? "warning" : "complete"}>{completenessGaps.length ? `${completenessGaps.length} gaps` : "Ready"}</strong></div>
      </div>

      <div className="rv-data-model-builder__layout">
        <section aria-label="Model setup" className="rv-data-model-builder__setup">
          <BuilderSection
            number="01"
            state={modelName.trim() ? "Complete" : "Name required"}
            stateTone={modelName.trim() ? "complete" : "warning"}
            summary="Identity and modeling context"
            title="Model details"
          >
            <div className="rv-data-model-builder__field-grid">
              <label className="rv-data-model-builder__field">
                <span>Data model name</span>
                <input aria-label="Data model name" readOnly={Boolean(currentModelId) || submitting === "save"} value={modelName} onChange={(event) => {
                  saveRevision.current += 1;
                  setModelName(event.target.value);
                  setFeedback(null);
                }} />
                {currentModelId ? <small>Names are immutable after the first save.</small> : null}
              </label>
              <label className="rv-data-model-builder__field">
                <span>Description</span>
                <textarea value={description} onChange={(event) => {
                  saveRevision.current += 1;
                  setDescription(event.target.value);
                  setFeedback(null);
                }} placeholder="What analytical question does this model support?" />
              </label>
            </div>
          </BuilderSection>

          <BuilderSection
            number="02"
            state={`${draft.sources.length} configured`}
            stateTone={draft.sources.length ? "complete" : "warning"}
            summary="Owned saved SQLite connections only"
            title="Source connections"
          >
            {connectionsLoading ? <p className="rv-data-model-builder__inline-state">Loading saved connections...</p> : null}
            {!connectionsLoading && !connections.length ? (
              <p className="rv-data-model-builder__inline-state">No saved SQLite Connections are available. Create a Connection before configuring this model.</p>
            ) : null}
            {draft.sources.length ? (
              <div className="rv-data-model-builder__source-table">
                <div className="rv-data-model-builder__source-row rv-data-model-builder__source-row--header" aria-hidden="true">
                  <span>Connection</span><span>Model alias</span><span>Role</span><span />
                </div>
                {draft.sources.map((source, index) => {
                  const connection = connectionById.get(source.connection_id);
                  const role = draft.fact_table?.connection_id === source.connection_id
                    ? "Fact source"
                    : draft.dimensions.some((dimension) => dimension.connection_id === source.connection_id)
                      ? "Dimension source"
                      : "Available";
                  return (
                    <div className="rv-data-model-builder__source-row" key={`${source.connection_id}-${index}`}>
                      <span className="rv-data-model-builder__source-name">
                        <strong>{connection?.label ?? "Missing connection"}</strong>
                        <small>
                          {schemaByConnection[source.connection_id]?.loading ? "Loading schema..." : schemaByConnection[source.connection_id]?.error ?? "SQLite"}
                          {schemaByConnection[source.connection_id]?.error ? (
                            <button
                              aria-label={`Retry ${connection?.label ?? source.alias} schema`}
                              className="rv-data-model-builder__inline-button"
                              onClick={() => retrySchemaMetadata(source.connection_id)}
                              type="button"
                            >
                              Retry
                            </button>
                          ) : null}
                        </small>
                      </span>
                      <label className="rv-data-model-builder__compact-field">
                        <span>Source alias {index + 1}</span>
                        <input aria-label={`Source alias ${index + 1}`} value={source.alias} onChange={(event) => {
                          const alias = event.target.value;
                          mutateDraft((current) => ({
                            ...current,
                            sources: current.sources.map((item, itemIndex) => itemIndex === index ? { ...item, alias } : item)
                          }));
                        }} />
                      </label>
                      <span className="rv-data-model-builder__role">{role}</span>
                      <button aria-label={`Remove source ${connection?.label ?? index + 1}`} className="rv-data-model-builder__icon-button" onClick={() => handleRemoveSource(source.connection_id)} type="button">×</button>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <div className="rv-data-model-builder__add-row">
              <label className="rv-data-model-builder__field">
                <span>New source connection</span>
                <select disabled={connectionsLoading || draft.sources.length >= MAX_SOURCES} value={newSourceConnectionId} onChange={(event) => setNewSourceConnectionId(event.target.value)}>
                  <option value="">Select a saved Connection</option>
                  {availableConnections.map((connection) => <option key={connection.id} value={connection.id}>{connection.label}</option>)}
                </select>
              </label>
              <button className="rv-data-model-builder__secondary-button" disabled={!newSourceConnectionId || draft.sources.length >= MAX_SOURCES} onClick={handleAddSource} type="button">
                Add source connection
              </button>
            </div>

            {missingConnectionIds.map((missingConnectionId, index) => (
              <div className="rv-data-model-builder__repair" key={missingConnectionId} role="region" aria-label={`Missing source repair ${index + 1}`}>
                <div><strong>Source connection is missing</strong><p>Choose a replacement to preserve tables, aliases, relationships, and rules where possible.</p></div>
                <label className="rv-data-model-builder__field">
                  <span>{missingConnectionIds.length === 1 ? "Replacement connection" : `Replacement connection ${index + 1}`}</span>
                  <select
                    aria-label={missingConnectionIds.length === 1 ? "Replacement connection" : `Replacement connection ${index + 1}`}
                    value={replacementConnections[missingConnectionId] ?? ""}
                    onChange={(event) => setReplacementConnections((current) => ({ ...current, [missingConnectionId]: event.target.value }))}
                  >
                    <option value="">Select a replacement</option>
                    {connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.label}</option>)}
                  </select>
                </label>
                <button disabled={submittingAny || !replacementConnections[missingConnectionId]} onClick={() => handleRepairSource(missingConnectionId)} type="button">
                  {submitting === "repair" ? "Repairing..." : "Repair Source"}
                </button>
              </div>
            ))}
          </BuilderSection>

          <BuilderSection
            number="03"
            state={draft.fact_table?.table ? "Configured" : "Required"}
            stateTone={draft.fact_table?.table ? "complete" : "warning"}
            summary="The central table and analytical grain"
            title="Fact table"
          >
            <div className="rv-data-model-builder__field-grid rv-data-model-builder__field-grid--two rv-data-model-builder__fact-grid">
              <label className="rv-data-model-builder__field">
                <span>Fact source connection</span>
                <select disabled={!draft.sources.length} value={draft.fact_table?.connection_id ?? ""} onChange={(event) => handleFactSource(event.target.value)}>
                  <option value="">Select a configured source</option>
                  {draft.sources.map((source) => <option key={source.connection_id} value={source.connection_id}>{connectionById.get(source.connection_id)?.label ?? source.alias}</option>)}
                </select>
              </label>
              <label className="rv-data-model-builder__field">
                <span>Fact table or view</span>
                <select aria-label="Fact table or view" disabled={!draft.fact_table || !factSchemaState || factSchemaState.loading || Boolean(factSchemaState.error) || !factSchemaState.objects.length} value={draft.fact_table?.table ?? ""} onChange={(event) => handleFactTable(event.target.value)}>
                  <option value="">
                    {factSchemaState?.loading
                      ? "Loading schema..."
                      : factSchemaState?.error
                        ? "Schema unavailable"
                        : factSchemaState && !factSchemaState.objects.length
                          ? "No tables or views found"
                          : "Select a table or view"}
                  </option>
                  {draft.fact_table?.table && !schemaObject(draft.fact_table.connection_id, draft.fact_table.table) ? <option value={draft.fact_table.table}>{draft.fact_table.table} · unavailable</option> : null}
                  {draft.fact_table ? schemaObjects(draft.fact_table.connection_id).map((object) => <option key={object.name} value={object.name}>{object.name} · {object.object_type}</option>) : null}
                </select>
                {factSchemaState?.error ? (
                  <small className="rv-data-model-builder__schema-error">
                    {factSchemaState.error}
                    <button
                      aria-label={`Retry fact schema for ${factConnectionLabel}`}
                      className="rv-data-model-builder__inline-button"
                      onClick={() => retrySchemaMetadata(draft.fact_table?.connection_id ?? "")}
                      type="button"
                    >
                      Retry schema
                    </button>
                  </small>
                ) : null}
              </label>
              <label className="rv-data-model-builder__field">
                <span>Fact alias</span>
                <input disabled={!draft.fact_table} value={draft.fact_table?.alias ?? ""} onChange={(event) => handleAliasChange("fact", draft.fact_table?.alias ?? "", event.target.value)} />
              </label>
              <div className="rv-data-model-builder__field">
                <span>Fact primary key columns</span>
                <ColumnMultiSelect
                  ariaLabel="Fact primary key columns"
                  columns={draft.fact_table ? schemaObject(draft.fact_table.connection_id, draft.fact_table.table)?.columns ?? [] : []}
                  disabled={!draft.fact_table || !schemaObject(draft.fact_table.connection_id, draft.fact_table.table)}
                  onChange={(primaryKey) => {
                  mutateDraft((current) => ({ ...current, fact_table: current.fact_table ? { ...current.fact_table, primary_key: primaryKey } : null }));
                  }}
                  value={draft.fact_table?.primary_key ?? []}
                />
              </div>
              <label className="rv-data-model-builder__field rv-data-model-builder__field--wide">
                <span>Grain</span>
                <input disabled={!draft.fact_table} placeholder="One row per account observation date" value={draft.fact_table?.grain ?? ""} onChange={(event) => {
                  const grain = event.target.value;
                  mutateDraft((current) => ({ ...current, fact_table: current.fact_table ? { ...current.fact_table, grain } : null }));
                }} />
              </label>
            </div>
          </BuilderSection>

          <BuilderSection
            number="04"
            state={`${draft.dimensions.length} configured`}
            stateTone={draft.dimensions.length ? "complete" : undefined}
            summary="Repeat tables through distinct role-playing aliases"
            title="Dimensions"
          >
            <div className="rv-data-model-builder__repeatable-list">
              {draft.dimensions.map((dimension, index) => (
                <fieldset className="rv-data-model-builder__repeatable rv-data-model-builder__dimension-card" key={dimension.id}>
                  <legend>Dimension {index + 1}</legend>
                  <div className="rv-data-model-builder__field-grid rv-data-model-builder__field-grid--two rv-data-model-builder__dimension-grid">
                    <button aria-label={`Remove dimension ${index + 1}`} className="rv-data-model-builder__remove-button" onClick={() => handleRemoveDimension(dimension.id)} type="button">Remove</button>
                    <label className="rv-data-model-builder__field">
                      <span>Source connection</span>
                      <select aria-label={`Dimension ${index + 1} source connection`} value={dimension.connection_id} onChange={(event) => handleDimensionSource(dimension.id, event.target.value)}>
                        {draft.sources.map((source) => <option key={source.connection_id} value={source.connection_id}>{connectionById.get(source.connection_id)?.label ?? source.alias}</option>)}
                      </select>
                    </label>
                    <label className="rv-data-model-builder__field">
                      <span>Table or view</span>
                      <select aria-label={`Dimension ${index + 1} table or view`} disabled={!schemaByConnection[dimension.connection_id] || schemaByConnection[dimension.connection_id]?.loading || Boolean(schemaByConnection[dimension.connection_id]?.error) || !schemaObjects(dimension.connection_id).length} value={dimension.table} onChange={(event) => handleDimensionTable(dimension.id, event.target.value)}>
                        <option value="">
                          {schemaByConnection[dimension.connection_id]?.loading
                            ? "Loading schema..."
                            : schemaByConnection[dimension.connection_id]?.error
                              ? "Schema unavailable"
                              : schemaByConnection[dimension.connection_id] && !schemaObjects(dimension.connection_id).length
                                ? "No tables or views found"
                                : "Select a table or view"}
                        </option>
                        {dimension.table && !schemaObject(dimension.connection_id, dimension.table) ? <option value={dimension.table}>{dimension.table} · unavailable</option> : null}
                        {schemaObjects(dimension.connection_id).map((object) => <option key={object.name} value={object.name}>{object.name} · {object.object_type}</option>)}
                      </select>
                    </label>
                    <label className="rv-data-model-builder__field">
                      <span>Dimension alias</span>
                      <input aria-label={`Dimension ${index + 1} alias`} value={dimension.alias} onChange={(event) => handleAliasChange(dimension.id, dimension.alias, event.target.value)} />
                    </label>
                    <div className="rv-data-model-builder__field rv-data-model-builder__dimension-key-field">
                      <span>Primary key columns</span>
                      <ColumnMultiSelect
                        ariaLabel={`Dimension ${index + 1} primary key columns`}
                        columns={schemaObject(dimension.connection_id, dimension.table)?.columns ?? []}
                        disabled={!schemaObject(dimension.connection_id, dimension.table)}
                        onChange={(primaryKey) => {
                        mutateDraft((current) => ({ ...current, dimensions: current.dimensions.map((item) => item.id === dimension.id ? { ...item, primary_key: primaryKey } : item) }));
                        }}
                        value={dimension.primary_key}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}
            </div>
            <button className="rv-data-model-builder__secondary-button" disabled={!draft.sources.length || draft.dimensions.length >= MAX_DIMENSIONS} onClick={handleAddDimension} type="button">Add dimension</button>
          </BuilderSection>

          <BuilderSection
            number="05"
            state={`${draft.relationships.length} joins`}
            stateTone={draft.relationships.every((relationship) => relationship.key_pairs.length > 0) ? "complete" : "warning"}
            summary="Review detected joins or connect configured tables"
            title="Relationships"
          >
            {relationshipSuggestions.length ? (
              <div className="rv-data-model-builder__detected-joins">
                <div className="rv-data-model-builder__detected-header">
                  <div><strong>Detected joins</strong><p>Declared foreign keys available from the connected model path.</p></div>
                  <div className="rv-data-model-builder__detected-actions">
                    <span>{relationshipSuggestions.length} suggestions</span>
                    <button
                      aria-label={`Add ${selectedSuggestionIds.length} selected relationships`}
                      className="rv-data-model-builder__secondary-button"
                      disabled={!selectedSuggestionIds.length}
                      onClick={() => handleAcceptSuggestions(selectedSuggestionIds)}
                      type="button"
                    >
                      Add selected
                    </button>
                  </div>
                </div>
                {relationshipSuggestions.map((suggestion) => {
                  const equality = suggestion.columnPairs
                    .map((pair) => `${suggestion.parentTable}.${pair.parent_column} = ${suggestion.referencedTable}.${pair.child_column}`)
                    .join(" AND ");
                  return (
                    <div className="rv-data-model-builder__detected-join" key={suggestion.id}>
                      <label className="rv-data-model-builder__detected-choice">
                        <input
                          aria-label={`Select detected relationship ${equality}`}
                          checked={selectedSuggestionIds.includes(suggestion.id)}
                          onChange={(event) => handleToggleSuggestion(suggestion.id, event.target.checked)}
                          type="checkbox"
                        />
                        <span><strong>{equality}</strong><small>Declared foreign key · path depth {suggestion.depth}</small></span>
                      </label>
                      <div className="rv-data-model-builder__detected-target-actions">
                        {suggestion.reusableTableIds.length > 1 ? (
                          <label className="rv-data-model-builder__detected-target">
                            <span>Target alias</span>
                            <select
                              aria-label={`Detected relationship target ${equality}`}
                              onChange={(event) => setSuggestionTargetSelections((current) => ({
                                ...current,
                                [suggestion.id]: event.target.value
                              }))}
                              value={suggestionTargetSelections[suggestion.id] ?? ""}
                            >
                              <option value="">Choose a target</option>
                              <option disabled={draft.dimensions.length >= MAX_DIMENSIONS} value="new">Create a new alias</option>
                              {suggestion.reusableTableIds.map((tableId) => {
                                const table = tablesById.get(tableId);
                                return <option key={tableId} value={tableId}>{table?.alias || table?.table || tableId}</option>;
                              })}
                            </select>
                          </label>
                        ) : null}
                        <button
                          aria-label={`Add detected relationship ${equality}`}
                          className="rv-data-model-builder__secondary-button"
                          onClick={() => handleAcceptSuggestions([suggestion.id])}
                          type="button"
                        >
                          Add relationship
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {relationshipSuggestionsOmitted ? (
              <p className="rv-data-model-builder__inline-state" role="status">
                Some detected relationships were omitted because the discovery limit or remaining dimension capacity was reached.
              </p>
            ) : null}
            <div className="rv-data-model-builder__repeatable-list">
              {!draft.relationships.length ? <p className="rv-data-model-builder__inline-state">Add or detect a relationship to connect dimensions to the fact root.</p> : null}
              {draft.relationships.map((relationship, index) => {
                const parent = tablesById.get(relationship.parent_table_id);
                const child = tablesById.get(relationship.child_table_id);
                const parentColumns = schemaObject(parent?.connection_id ?? "", parent?.table ?? "")?.columns ?? [];
                const childColumns = schemaObject(child?.connection_id ?? "", child?.table ?? "")?.columns ?? [];
                const incomingIds = new Set(
                  draft.relationships
                    .filter((item) => item.id !== relationship.id)
                    .map((item) => item.child_table_id)
                );
                const relationshipsWithoutCurrent = draft.relationships.filter((item) => item.id !== relationship.id);
                const connectedWithoutCurrent = connectedTableIds({ ...draft, relationships: relationshipsWithoutCurrent });
                const childDescendants = descendantTableIds(draft, relationship.child_table_id, relationship.id);
                return (
                  <fieldset className="rv-data-model-builder__repeatable" key={relationship.id}>
                    <legend>{parent?.alias || "Unresolved parent"} → {child?.alias || `relationship ${index + 1}`}</legend>
                    <button aria-label={`Remove relationship ${index + 1}`} className="rv-data-model-builder__remove-button" onClick={() => mutateDraft((current) => ({ ...current, relationships: current.relationships.filter((item) => item.id !== relationship.id) }))} type="button">Remove</button>
                    <div className="rv-data-model-builder__field-grid rv-data-model-builder__field-grid--relationship">
                      <label className="rv-data-model-builder__field">
                        <span>From table</span>
                        <select aria-label={`Relationship ${index + 1} parent table`} value={relationship.parent_table_id} onChange={(event) => handleRelationshipEndpointChange(relationship, "parent_table_id", event.target.value)}>
                          <option value="">Select a connected table</option>
                          {modelTables(draft).filter(
                            (table) => (connectedWithoutCurrent.has(table.id) || table.id === relationship.parent_table_id)
                              && table.id !== relationship.child_table_id
                              && !childDescendants.has(table.id)
                          ).map((table) => <option key={table.id} value={table.id}>{table.alias || table.table || "Unnamed table"}</option>)}
                        </select>
                      </label>
                      <label className="rv-data-model-builder__field">
                        <span>Joined table</span>
                        <select aria-label={`Relationship ${index + 1} child table`} value={relationship.child_table_id} onChange={(event) => handleRelationshipEndpointChange(relationship, "child_table_id", event.target.value)}>
                          <option value="">Select an unconnected dimension</option>
                          {draft.dimensions.filter(
                            (dimension) => !incomingIds.has(dimension.id)
                              && dimension.id !== relationship.parent_table_id
                              && !descendantTableIds(draft, dimension.id, relationship.id).has(relationship.parent_table_id)
                          ).map((dimension) => <option key={dimension.id} value={dimension.id}>{dimension.alias || dimension.table || "Unnamed dimension"}</option>)}
                        </select>
                      </label>
                      <label className="rv-data-model-builder__field">
                        <span>Join type</span>
                        <select aria-label={`Relationship ${index + 1} join type`} value={relationship.join_type} onChange={(event) => updateRelationship(relationship.id, (current) => ({ ...current, join_type: event.target.value as "left" | "inner" }))}>
                          <option value="left">Left join</option><option value="inner">Inner join</option>
                        </select>
                      </label>
                    </div>
                    {relationship.join_type === "inner" ? <p className="rv-data-model-builder__inner-warning">Inner joins can filter fact rows. Compile-only testing cannot measure row retention.</p> : null}
                    <div className="rv-data-model-builder__key-pairs">
                      {relationship.key_pairs.map((pair, pairIndex) => (
                        <div className="rv-data-model-builder__key-pair" key={`${relationship.id}-${pairIndex}`}>
                          <label className="rv-data-model-builder__field">
                            <span>Parent column</span>
                            <select aria-label={`Relationship ${index + 1} parent column ${pairIndex + 1}`} value={pair.parent_column} onChange={(event) => updateRelationship(relationship.id, (current) => ({
                              ...current,
                              key_pairs: current.key_pairs.map((item, itemIndex) => itemIndex === pairIndex ? { ...item, parent_column: event.target.value } : item)
                            }))}>
                              <option value="">Select parent column</option>
                              {pair.parent_column && !parentColumns.some((column) => column.name === pair.parent_column) ? <option value={pair.parent_column}>{pair.parent_column} · unavailable</option> : null}
                              {parentColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
                            </select>
                          </label>
                          <span aria-hidden="true" className="rv-data-model-builder__equals">=</span>
                          <label className="rv-data-model-builder__field">
                            <span>Child column</span>
                            <select aria-label={`Relationship ${index + 1} child column ${pairIndex + 1}`} value={pair.child_column} onChange={(event) => updateRelationship(relationship.id, (current) => ({
                              ...current,
                              key_pairs: current.key_pairs.map((item, itemIndex) => itemIndex === pairIndex ? { ...item, child_column: event.target.value } : item)
                            }))}>
                              <option value="">Select child column</option>
                              {pair.child_column && !childColumns.some((column) => column.name === pair.child_column) ? <option value={pair.child_column}>{pair.child_column} · unavailable</option> : null}
                              {childColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
                            </select>
                          </label>
                          <button aria-label={`Remove key pair ${pairIndex + 1} for ${child?.alias || `relationship ${index + 1}`}`} className="rv-data-model-builder__icon-button" onClick={() => updateRelationship(relationship.id, (current) => ({ ...current, key_pairs: current.key_pairs.filter((_, itemIndex) => itemIndex !== pairIndex) }))} type="button">×</button>
                        </div>
                      ))}
                    </div>
                    <button aria-label={`Add key pair for ${child?.alias || `relationship ${index + 1}`}`} className="rv-data-model-builder__secondary-button" disabled={!parent?.table || !child?.table} onClick={() => handleAddKeyPair(relationship)} type="button">Add key pair</button>
                  </fieldset>
                );
              })}
            </div>
            <button
              className="rv-data-model-builder__secondary-button"
              disabled={!draft.fact_table || !draft.dimensions.some((dimension) => !draft.relationships.some((relationship) => relationship.child_table_id === dimension.id))}
              onClick={handleAddRelationship}
              type="button"
            >
              Add relationship
            </button>
          </BuilderSection>

          <BuilderSection
            number="06"
            state={`${draft.business_rules.length} configured`}
            stateTone={draft.business_rules.every((rule) => rule.name.trim() && rule.expression.trim()) ? "complete" : "warning"}
            summary="Constrained row-level SQL expressions"
            title="Business rules"
          >
            <div className="rv-data-model-builder__alias-reference">
              <strong>Available aliases</strong>
              <span>{[draft.fact_table?.alias, ...draft.dimensions.map((dimension) => dimension.alias)].filter(Boolean).join(" · ") || "Configure a fact table and dimensions first"}</span>
            </div>
            <div className="rv-data-model-builder__repeatable-list">
              {draft.business_rules.map((rule, index) => (
                <fieldset className="rv-data-model-builder__repeatable" key={rule.id}>
                  <legend>Business rule {index + 1}</legend>
                  <button aria-label={`Remove business rule ${index + 1}`} className="rv-data-model-builder__remove-button" onClick={() => mutateDraft((current) => ({ ...current, business_rules: current.business_rules.filter((item) => item.id !== rule.id) }))} type="button">Remove</button>
                  <div className="rv-data-model-builder__field-grid rv-data-model-builder__field-grid--rule">
                    <label className="rv-data-model-builder__field">
                      <span>Rule name</span>
                      <input aria-label={`Business rule ${index + 1} name`} value={rule.name} onChange={(event) => updateRule(rule.id, { name: event.target.value })} />
                    </label>
                    <label className="rv-data-model-builder__field">
                      <span>Output type</span>
                      <select aria-label={`Business rule ${index + 1} output type`} value={rule.output_type} onChange={(event) => updateRule(rule.id, { output_type: event.target.value as DataModelBusinessRule["output_type"] })}>
                        {outputTypes.map((outputType) => <option key={outputType} value={outputType}>{outputType}</option>)}
                      </select>
                    </label>
                    <label className="rv-data-model-builder__field rv-data-model-builder__field--wide">
                      <span>Expression</span>
                      <textarea aria-label={`Business rule ${index + 1} expression`} placeholder="case when fact_loans.days_past_due >= 30 then 1 else 0 end" value={rule.expression} onChange={(event) => updateRule(rule.id, { expression: event.target.value })} />
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>
            <button className="rv-data-model-builder__secondary-button" disabled={draft.business_rules.length >= MAX_BUSINESS_RULES} onClick={handleAddRule} type="button">Add business rule</button>
          </BuilderSection>
        </section>

        <aside aria-label="Model preview" className="rv-data-model-builder__inspector" role="region">
          <section className="rv-data-model-builder__inspector-card">
            <div className="rv-data-model-builder__inspector-header"><strong>Model map</strong><span>{modelMapRows.length} connected</span></div>
            <div className="rv-data-model-builder__star-map">
              <div className="rv-data-model-builder__star-fact"><small>Fact</small><strong>{draft.fact_table?.alias || "Fact table not selected"}</strong></div>
              <div className="rv-data-model-builder__star-dimensions">
                {modelMapRows.length ? modelMapRows.map(({ relationship, depth }) => {
                  const parent = tablesById.get(relationship.parent_table_id);
                  const child = tablesById.get(relationship.child_table_id);
                  return (
                    <div className="rv-data-model-builder__star-relationship" key={relationship.id} style={{ marginLeft: `${depth * 12}px` }}>
                      <span className="rv-data-model-builder__star-line" /><span className="rv-data-model-builder__join-badge">{relationship?.join_type ?? "left"}</span>
                      <div><small>{parent?.alias || "Unresolved"} →</small><strong>{child?.alias || "Unresolved dimension"}</strong></div>
                    </div>
                  );
                }) : <p>Add or detect relationships to grow the model.</p>}
                {draft.dimensions.filter((dimension) => !connectedIds.has(dimension.id)).map((dimension) => (
                  <div className="rv-data-model-builder__star-relationship rv-data-model-builder__star-relationship--disconnected" key={`disconnected-${dimension.id}`}>
                    <span className="rv-data-model-builder__star-line" /><span className="rv-data-model-builder__join-badge">repair</span>
                    <div><small>Disconnected</small><strong>{dimension.alias || "Unnamed dimension"}</strong></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rv-data-model-builder__inspector-card">
            <div className="rv-data-model-builder__inspector-header"><strong>Diagnostics</strong><span>{diagnostics.length + completenessGaps.length} items</span></div>
            {diagnostics.some((item) => item.stale) ? <p className="rv-data-model-builder__stale">Diagnostics are stale after the latest save.</p> : null}
            <div className="rv-data-model-builder__diagnostics" aria-label="Diagnostics">
              {completenessGaps.map((message) => <p data-severity="warning" key={message}><span />{message}</p>)}
              {diagnostics.map((item) => <p data-severity={item.severity} key={`${item.severity}-${item.code}-${item.message}`}><span />{item.message}</p>)}
              {!diagnostics.length && !completenessGaps.length ? <p data-severity="success"><span />No structural gaps are visible. Run Test model for authoritative validation.</p> : null}
            </div>
            <p className="rv-data-model-builder__compile-note"><strong>Compile-only test.</strong> Testing does not validate multi-hop filtering, row retention, fanout, unmatched dimensions, or cardinality.</p>
          </section>
        </aside>
      </div>

      <div aria-live="polite" className="rv-data-model-builder__feedback-region">
        {feedback ? <p className="rv-data-model-builder__feedback">{feedback}</p> : null}
        {draftTestNotice ? <p className="rv-data-model-builder__draft-test">{draftTestNotice}</p> : null}
      </div>

      <footer className="rv-data-model-builder__actions">
        <div>{currentModelId ? <button className="rv-data-model-builder__danger-button" disabled={submittingAny} onClick={handleDrop} type="button">{submitting === "drop" ? "Dropping..." : "Drop"}</button> : null}</div>
        <div className="rv-data-model-builder__action-group">
          <span className="rv-data-model-builder__dirty-state">{dirty && currentModelId ? "Draft changes not saved" : currentModelId ? "All changes saved" : "Save a name-only draft at any time"}</span>
          <button className="rv-data-model-builder__test-button" disabled={submittingAny} onClick={handleTest} type="button">{submitting === "test" ? "Testing..." : "Test model"}</button>
          <button className="rv-data-model-builder__primary-button" disabled={submittingAny || !modelName.trim()} onClick={handleSave} type="button">{submitting === "save" ? "Saving..." : currentModelId ? "Save Changes" : "Save Draft"}</button>
        </div>
      </footer>
    </div>
  );
}
