"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { SavedConnection } from "@/features/creditmodeler/connection-types";
import { listConnections } from "@/features/creditmodeler/connections-client";
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

function emptyModel(): DataModelDefinition {
  return { sources: [], fact_table: null, dimensions: [], relationships: [], business_rules: [], measures: [], metadata: {} };
}

function aliasFor(prefix: string, value: string): string {
  const normalized = value
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return `${prefix}_${normalized || "source"}`;
}

function itemId(prefix: "dim" | "rel" | "rule"): string {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${value}`;
}

function modelSnapshot(name: string, description: string, model: DataModelDefinition): string {
  return JSON.stringify({ name, description, model });
}

function selectedValues(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions, (option) => option.value);
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
      if (!draft.relationships.some((relationship) => relationship.dimension_id === dimension.id)) {
        gaps.push(`Add a direct relationship for ${dimension.alias || `dimension ${index + 1}`}.`);
      }
    });
    draft.relationships.forEach((relationship) => {
      const dimension = draft.dimensions.find((item) => item.id === relationship.dimension_id);
      if (!relationship.key_pairs.length || relationship.key_pairs.some((pair) => !pair.fact_column || !pair.dimension_column)) {
        gaps.push(`Complete join keys for ${dimension?.alias || "a dimension"}.`);
        return;
      }
      const factColumns = new Set(findSchemaObject(draft.fact_table?.connection_id ?? "", draft.fact_table?.table ?? "")?.columns.map((column) => column.name) ?? []);
      const dimensionColumns = new Set(findSchemaObject(dimension?.connection_id ?? "", dimension?.table ?? "")?.columns.map((column) => column.name) ?? []);
      if (relationship.key_pairs.some((pair) => !factColumns.has(pair.fact_column) || !dimensionColumns.has(pair.dimension_column))) {
        gaps.push(`Repair unavailable join columns for ${dimension?.alias || "a dimension"}.`);
      }
    });
    draft.business_rules.forEach((rule, index) => {
      if (!rule.name.trim() || !rule.expression.trim()) {
        gaps.push(`Complete business rule ${index + 1}.`);
      }
    });
    return gaps;
  }, [draft, schemaByConnection]);

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
    const isReferenced = draft.fact_table?.connection_id === connectionId || draft.dimensions.some((dimension) => dimension.connection_id === connectionId);
    if (isReferenced && !window.confirm("Remove this source and its dependent fact or dimension configuration? Business rules will be preserved for repair.")) {
      return;
    }
    const removedDimensionIds = new Set(draft.dimensions.filter((dimension) => dimension.connection_id === connectionId).map((dimension) => dimension.id));
    mutateDraft((current) => ({
      ...current,
      sources: current.sources.filter((source) => source.connection_id !== connectionId),
      fact_table: current.fact_table?.connection_id === connectionId ? null : current.fact_table,
      dimensions: current.dimensions.filter((dimension) => dimension.connection_id !== connectionId),
      relationships: current.relationships.filter((relationship) => !removedDimensionIds.has(relationship.dimension_id))
    }));
  }

  function handleFactSource(connectionId: string) {
    if (!connectionId) {
      mutateDraft((current) => ({ ...current, fact_table: null }));
      return;
    }
    mutateDraft((current) => {
      if (!current.fact_table) {
        return {
          ...current,
          fact_table: {
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
      ],
      relationships: [
        ...current.relationships,
        { id: itemId("rel"), dimension_id: dimensionId, join_type: "left", key_pairs: [], metadata: {} }
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
    mutateDraft((current) => ({
      ...current,
      dimensions: current.dimensions.filter((dimension) => dimension.id !== dimensionId),
      relationships: current.relationships.filter((relationship) => relationship.dimension_id !== dimensionId)
    }));
  }

  function updateRelationship(relationshipId: string, update: (relationship: DataModelRelationship) => DataModelRelationship) {
    mutateDraft((current) => ({
      ...current,
      relationships: current.relationships.map((relationship) => (relationship.id === relationshipId ? update(relationship) : relationship))
    }));
  }

  function handleAddKeyPair(relationship: DataModelRelationship, dimension: DataModelDimension) {
    const factColumns = schemaObject(draft.fact_table?.connection_id ?? "", draft.fact_table?.table ?? "")?.columns ?? [];
    const dimensionColumns = schemaObject(dimension.connection_id, dimension.table)?.columns ?? [];
    const pair = {
      fact_column: factColumns.find((column) => !relationship.key_pairs.some((item) => item.fact_column === column.name))?.name ?? factColumns[0]?.name ?? "",
      dimension_column:
        dimensionColumns.find((column) => !relationship.key_pairs.some((item) => item.dimension_column === column.name))?.name ?? dimensionColumns[0]?.name ?? ""
    };
    updateRelationship(relationship.id, (current) => ({ ...current, key_pairs: [...current.key_pairs, pair] }));
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
          <p>Build a strict star schema from saved SQLite connections, then validate it with a zero-row compile test.</p>
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
            <div className="rv-data-model-builder__field-grid rv-data-model-builder__field-grid--two">
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
              <label className="rv-data-model-builder__field">
                <span>Fact primary key columns</span>
                <select aria-label="Fact primary key columns" disabled={!draft.fact_table?.table} multiple value={draft.fact_table?.primary_key ?? []} onChange={(event) => {
                  const primaryKey = selectedValues(event.currentTarget);
                  mutateDraft((current) => ({ ...current, fact_table: current.fact_table ? { ...current.fact_table, primary_key: primaryKey } : null }));
                }}>
                  {draft.fact_table ? schemaObject(draft.fact_table.connection_id, draft.fact_table.table)?.columns.map((column) => <option key={column.name} value={column.name}>{column.name}{column.primary_key ? " · PK" : ""}</option>) : null}
                </select>
                <small>Use Ctrl/Cmd to select a composite key.</small>
              </label>
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
                <fieldset className="rv-data-model-builder__repeatable" key={dimension.id}>
                  <legend>Dimension {index + 1}</legend>
                  <button aria-label={`Remove dimension ${index + 1}`} className="rv-data-model-builder__remove-button" onClick={() => handleRemoveDimension(dimension.id)} type="button">Remove</button>
                  <div className="rv-data-model-builder__field-grid rv-data-model-builder__field-grid--two">
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
                    <label className="rv-data-model-builder__field">
                      <span>Primary key columns</span>
                      <select aria-label={`Dimension ${index + 1} primary key columns`} multiple value={dimension.primary_key} onChange={(event) => {
                        const primaryKey = selectedValues(event.currentTarget);
                        mutateDraft((current) => ({ ...current, dimensions: current.dimensions.map((item) => item.id === dimension.id ? { ...item, primary_key: primaryKey } : item) }));
                      }}>
                        {schemaObject(dimension.connection_id, dimension.table)?.columns.map((column) => <option key={column.name} value={column.name}>{column.name}{column.primary_key ? " · PK" : ""}</option>)}
                      </select>
                      <small>Use Ctrl/Cmd to select a composite key.</small>
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>
            <button className="rv-data-model-builder__secondary-button" disabled={!draft.sources.length || draft.dimensions.length >= MAX_DIMENSIONS} onClick={handleAddDimension} type="button">Add dimension</button>
          </BuilderSection>

          <BuilderSection
            number="05"
            state={`${draft.relationships.length} direct joins`}
            stateTone={draft.relationships.every((relationship) => relationship.key_pairs.length > 0) ? "complete" : "warning"}
            summary="Every dimension joins directly to the fact table"
            title="Relationships"
          >
            <div className="rv-data-model-builder__repeatable-list">
              {!draft.relationships.length ? <p className="rv-data-model-builder__inline-state">Add a dimension to define its direct fact relationship.</p> : null}
              {draft.relationships.map((relationship, index) => {
                const dimension = draft.dimensions.find((item) => item.id === relationship.dimension_id);
                if (!dimension) {
                  return null;
                }
                const factColumns = schemaObject(draft.fact_table?.connection_id ?? "", draft.fact_table?.table ?? "")?.columns ?? [];
                const dimensionColumns = schemaObject(dimension.connection_id, dimension.table)?.columns ?? [];
                return (
                  <fieldset className="rv-data-model-builder__repeatable" key={relationship.id}>
                    <legend>{draft.fact_table?.alias || "fact"} → {dimension.alias || `dimension ${index + 1}`}</legend>
                    <label className="rv-data-model-builder__field rv-data-model-builder__join-type">
                      <span>Join type</span>
                      <select aria-label={`Relationship ${index + 1} join type`} value={relationship.join_type} onChange={(event) => updateRelationship(relationship.id, (current) => ({ ...current, join_type: event.target.value as "left" | "inner" }))}>
                        <option value="left">Left join</option><option value="inner">Inner join</option>
                      </select>
                    </label>
                    {relationship.join_type === "inner" ? <p className="rv-data-model-builder__inner-warning">Inner joins can filter fact rows. Compile-only testing cannot measure row retention.</p> : null}
                    <div className="rv-data-model-builder__key-pairs">
                      {relationship.key_pairs.map((pair, pairIndex) => (
                        <div className="rv-data-model-builder__key-pair" key={`${relationship.id}-${pairIndex}`}>
                          <label className="rv-data-model-builder__field">
                            <span>Fact column</span>
                            <select aria-label={`Relationship ${index + 1} fact column ${pairIndex + 1}`} value={pair.fact_column} onChange={(event) => updateRelationship(relationship.id, (current) => ({
                              ...current,
                              key_pairs: current.key_pairs.map((item, itemIndex) => itemIndex === pairIndex ? { ...item, fact_column: event.target.value } : item)
                            }))}>
                              <option value="">Select fact column</option>
                              {pair.fact_column && !factColumns.some((column) => column.name === pair.fact_column) ? <option value={pair.fact_column}>{pair.fact_column} · unavailable</option> : null}
                              {factColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
                            </select>
                          </label>
                          <span aria-hidden="true" className="rv-data-model-builder__equals">=</span>
                          <label className="rv-data-model-builder__field">
                            <span>Dimension column</span>
                            <select aria-label={`Relationship ${index + 1} dimension column ${pairIndex + 1}`} value={pair.dimension_column} onChange={(event) => updateRelationship(relationship.id, (current) => ({
                              ...current,
                              key_pairs: current.key_pairs.map((item, itemIndex) => itemIndex === pairIndex ? { ...item, dimension_column: event.target.value } : item)
                            }))}>
                              <option value="">Select dimension column</option>
                              {pair.dimension_column && !dimensionColumns.some((column) => column.name === pair.dimension_column) ? <option value={pair.dimension_column}>{pair.dimension_column} · unavailable</option> : null}
                              {dimensionColumns.map((column) => <option key={column.name} value={column.name}>{column.name}</option>)}
                            </select>
                          </label>
                          <button aria-label={`Remove key pair ${pairIndex + 1} for ${dimension.alias}`} className="rv-data-model-builder__icon-button" onClick={() => updateRelationship(relationship.id, (current) => ({ ...current, key_pairs: current.key_pairs.filter((_, itemIndex) => itemIndex !== pairIndex) }))} type="button">×</button>
                        </div>
                      ))}
                    </div>
                    <button aria-label={`Add key pair for ${dimension.alias}`} className="rv-data-model-builder__secondary-button" disabled={!draft.fact_table?.table || !dimension.table} onClick={() => handleAddKeyPair(relationship, dimension)} type="button">Add key pair</button>
                  </fieldset>
                );
              })}
            </div>
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
            <div className="rv-data-model-builder__inspector-header"><strong>Star map</strong><span>{1 + draft.dimensions.length} objects</span></div>
            <div className="rv-data-model-builder__star-map">
              <div className="rv-data-model-builder__star-fact"><small>Fact</small><strong>{draft.fact_table?.alias || "Fact table not selected"}</strong></div>
              <div className="rv-data-model-builder__star-dimensions">
                {draft.dimensions.length ? draft.dimensions.map((dimension) => {
                  const relationship = draft.relationships.find((item) => item.dimension_id === dimension.id);
                  return (
                    <div className="rv-data-model-builder__star-relationship" key={dimension.id}>
                      <span className="rv-data-model-builder__star-line" /><span className="rv-data-model-builder__join-badge">{relationship?.join_type ?? "left"}</span>
                      <div><small>Dimension</small><strong>{dimension.alias || "Unnamed dimension"}</strong></div>
                    </div>
                  );
                }) : <p>Add dimensions to grow the star.</p>}
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
            <p className="rv-data-model-builder__compile-note"><strong>Compile-only test.</strong> Testing does not validate row retention, fanout, unmatched dimensions, or cardinality.</p>
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
