"use client";

import { useEffect, useMemo, useState } from "react";

import type { SavedConnection } from "@/features/creditmodeler/connection-types";
import { listConnections } from "@/features/creditmodeler/connections-client";
import { createDataModel, deleteDataModel, getDataModel, inspectConnectionSchema, testSavedDataModel, testUnsavedDataModel, updateDataModel } from "@/features/creditmodeler/data-models-client";
import type { DataModelDefinition, DataModelDiagnostic, DataModelSchemaObject, SavedDataModel } from "@/features/creditmodeler/data-model-types";

function aliasFor(prefix: string, table: string): string {
  return `${prefix}_${table.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`.toLowerCase();
}

function emptyModel(): DataModelDefinition {
  return { sources: [], fact_table: null, dimensions: [], relationships: [], business_rules: [], measures: [], metadata: {} };
}

type DataModelBuilderProps = {
  modelId?: string;
  onDataModelDropped?: (modelId: string) => void;
  onDataModelSaved?: (model: SavedDataModel) => void;
};

export function DataModelBuilder({ modelId, onDataModelDropped, onDataModelSaved }: DataModelBuilderProps) {
  const [businessRuleExpression, setBusinessRuleExpression] = useState("");
  const [connections, setConnections] = useState<SavedConnection[]>([]);
  const [currentModelId, setCurrentModelId] = useState(modelId ?? "");
  const [diagnostics, setDiagnostics] = useState<DataModelDiagnostic[]>([]);
  const [description, setDescription] = useState("");
  const [dimensionTable, setDimensionTable] = useState("");
  const [factTable, setFactTable] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modelName, setModelName] = useState("");
  const [replacementConnectionId, setReplacementConnectionId] = useState("");
  const [savedDefinition, setSavedDefinition] = useState<DataModelDefinition | null>(null);
  const [schemaObjects, setSchemaObjects] = useState<DataModelSchemaObject[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState<string>("draft");

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
          setFeedback("Connections could not be loaded.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCurrentModelId(modelId ?? "");
    setDiagnostics([]);
    setFeedback(null);
    if (!modelId) {
      setBusinessRuleExpression("");
      setDescription("");
      setModelName("");
      setReplacementConnectionId("");
      setSavedDefinition(null);
      setSelectedConnectionId("");
      setTestStatus("draft");
      return;
    }
    let active = true;
    getDataModel(modelId)
      .then((saved) => {
        if (!active) {
          return;
        }
        applySavedModel(saved);
      })
      .catch(() => {
        if (active) {
          setFeedback("Data model could not be loaded.");
        }
      });
    return () => {
      active = false;
    };
  }, [modelId]);

  useEffect(() => {
    let active = true;
    setSchemaObjects([]);
    if (!selectedConnectionId) {
      return () => {
        active = false;
      };
    }
    inspectConnectionSchema(selectedConnectionId)
      .then((schema) => {
        if (active) {
          setSchemaObjects(schema.objects);
          setFactTable(schema.objects[0]?.name ?? "");
          setDimensionTable(schema.objects[1]?.name ?? schema.objects[0]?.name ?? "");
        }
      })
      .catch(() => {
        if (active) {
          setFeedback("Schema metadata could not be loaded.");
        }
      });
    return () => {
      active = false;
    };
  }, [selectedConnectionId]);

  const model = useMemo(() => buildModel(selectedConnectionId, factTable, dimensionTable, businessRuleExpression), [businessRuleExpression, dimensionTable, factTable, selectedConnectionId]);
  const missingConnection = diagnostics.find((item) => item.code === "missing_connection");

  async function handleTest() {
    setSubmitting(true);
    setFeedback(null);
    setDiagnostics([]);
    try {
      const result = currentModelId ? await testSavedDataModel(currentModelId) : await testUnsavedDataModel({ model });
      setDiagnostics([...result.errors, ...result.warnings]);
      setTestStatus(result.status);
      setFeedback(result.succeeded ? "Data model test succeeded." : "Data model test returned diagnostics.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Data model test failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave() {
    setSubmitting(true);
    setFeedback(null);
    try {
      const saved = currentModelId
        ? await updateDataModel(currentModelId, { name: modelName, description, model })
        : await createDataModel({ name: modelName, description, model });
      setCurrentModelId(saved.id);
      applySavedModel(saved);
      onDataModelSaved?.(saved);
      setFeedback("Data model saved.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Data model could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRepairSource() {
    if (!currentModelId || !replacementConnectionId) {
      return;
    }
    const repairedModel = replaceModelConnection(savedDefinition ?? model, replacementConnectionId);
    setSubmitting(true);
    setFeedback(null);
    try {
      const saved = await updateDataModel(currentModelId, { name: modelName, description, model: repairedModel });
      applySavedModel(saved);
      onDataModelSaved?.(saved);
      setFeedback("Source repaired. Review preserved configuration before retesting.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Source could not be repaired.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDrop() {
    if (!currentModelId || !window.confirm("Drop this data model? Source connections and files will not be deleted.")) {
      return;
    }
    setSubmitting(true);
    try {
      await deleteDataModel(currentModelId);
      onDataModelDropped?.(currentModelId);
      setFeedback("Data model dropped.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Data model could not be dropped.");
    } finally {
      setSubmitting(false);
    }
  }

  function applySavedModel(saved: SavedDataModel) {
    setCurrentModelId(saved.id);
    setModelName(saved.name);
    setDescription(saved.description ?? "");
    setTestStatus(saved.test_status);
    setDiagnostics([...saved.last_test_errors, ...saved.last_test_warnings]);
    setSavedDefinition(saved.model);
    setReplacementConnectionId("");
    setSelectedConnectionId(saved.model.sources[0]?.connection_id ?? saved.model.fact_table?.connection_id ?? "");
    setFactTable(saved.model.fact_table?.table ?? "");
    setDimensionTable(saved.model.dimensions[0]?.table ?? "");
    setBusinessRuleExpression(saved.model.business_rules[0]?.expression ?? "");
  }

  return (
    <div className="rv-data-model-builder" data-testid="data-model-builder">
      <div className="rv-data-model-builder__header">
        <p className="rv-data-model-builder__eyebrow">Data Models</p>
        <h2>{currentModelId && modelName ? modelName : "New data model"}</h2>
        <p>Configure a strict star-schema draft and run a compile-only test before saving.</p>
        <span className="rv-data-model-builder__status">{testStatus}</span>
      </div>

      <div className="rv-data-model-builder__layout">
        <section className="rv-data-model-builder__panel" aria-label="Model setup">
          <label className="rv-data-model-builder__field">
            <span>Data model name</span>
            <input readOnly={Boolean(currentModelId)} value={modelName} onChange={(event) => setModelName(event.target.value)} />
          </label>

          {currentModelId && missingConnection ? (
            <div className="rv-data-model-builder__repair" role="region" aria-label="Missing source repair">
              <p>Replace the missing source to keep table names, aliases, relationships, and business rules where possible.</p>
              <label className="rv-data-model-builder__field">
                <span>Replacement connection</span>
                <select value={replacementConnectionId} onChange={(event) => setReplacementConnectionId(event.target.value)}>
                  <option value="">Select a replacement</option>
                  {connections.map((connection) => (
                    <option key={connection.id} value={connection.id}>
                      {connection.label}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={submitting || !replacementConnectionId} onClick={handleRepairSource} type="button">
                Repair Source
              </button>
            </div>
          ) : null}

          <label className="rv-data-model-builder__field">
            <span>Description</span>
            <input value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <label className="rv-data-model-builder__field">
            <span>Source connection</span>
            <select value={selectedConnectionId} onChange={(event) => setSelectedConnectionId(event.target.value)}>
              <option value="">Select a source</option>
              {connections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.label}
                </option>
              ))}
            </select>
          </label>

          <label className="rv-data-model-builder__field">
            <span>Fact table</span>
            <select disabled={!schemaObjects.length} value={factTable} onChange={(event) => setFactTable(event.target.value)}>
              {schemaObjects.map((object) => (
                <option key={object.name} value={object.name}>
                  {object.name}
                </option>
              ))}
            </select>
          </label>

          <label className="rv-data-model-builder__field">
            <span>Dimension table</span>
            <select disabled={!schemaObjects.length} value={dimensionTable} onChange={(event) => setDimensionTable(event.target.value)}>
              {schemaObjects.map((object) => (
                <option key={object.name} value={object.name}>
                  {object.name}
                </option>
              ))}
            </select>
          </label>

          <label className="rv-data-model-builder__field rv-data-model-builder__field--wide">
            <span>Business rule expression</span>
            <textarea value={businessRuleExpression} onChange={(event) => setBusinessRuleExpression(event.target.value)} placeholder="upper(dim_customers.name)" />
          </label>
        </section>

        <section className="rv-data-model-builder__panel rv-data-model-builder__panel--preview" aria-label="Model preview">
          <p className="rv-data-model-builder__label">Star preview</p>
          <div className="rv-data-model-builder__star">
            <div>{model.fact_table?.alias ?? "fact table"}</div>
            <span />
            <div>{model.dimensions[0]?.alias ?? "dimension"}</div>
          </div>
          <p className="rv-data-model-builder__note">Compile-only tests do not validate row retention, fanout, unmatched dimensions, or cardinality.</p>
        </section>
      </div>

      {feedback ? <p className="rv-data-model-builder__feedback">{feedback}</p> : null}
      {diagnostics.some((item) => item.stale) ? <p className="rv-data-model-builder__stale">Diagnostics are stale after the latest save.</p> : null}
      {diagnostics.length ? (
        <div className="rv-data-model-builder__diagnostics" aria-label="Diagnostics">
          {diagnostics.map((item) => (
            <p key={`${item.severity}-${item.code}-${item.message}`} data-severity={item.severity}>
              {item.message}
            </p>
          ))}
        </div>
      ) : null}

      <div className="rv-data-model-builder__actions">
        <button disabled={submitting || !modelName.trim()} onClick={handleSave} type="button">
          {currentModelId ? "Save Changes" : "Save Draft"}
        </button>
        <button disabled={submitting} onClick={handleTest} type="button">
          Test
        </button>
        {currentModelId ? (
          <button disabled={submitting} onClick={handleDrop} type="button">
            Drop
          </button>
        ) : null}
      </div>
    </div>
  );
}

function buildModel(connectionId: string, factTable: string, dimensionTable: string, businessRuleExpression: string): DataModelDefinition {
  const model = emptyModel();
  if (!connectionId) {
    return model;
  }
  model.sources = [{ connection_id: connectionId, alias: "source", metadata: {} }];
  if (factTable) {
    model.fact_table = {
      connection_id: connectionId,
      table: factTable,
      object_type: "table",
      alias: aliasFor("fact", factTable),
      grain: null,
      primary_key: ["account_id"],
      metadata: {}
    };
  }
  if (dimensionTable) {
    const dimensionAlias = aliasFor("dim", dimensionTable);
    model.dimensions = [
      {
        id: `dim_${dimensionTable}`,
        connection_id: connectionId,
        table: dimensionTable,
        object_type: "table",
        alias: dimensionAlias,
        primary_key: ["customer_id"],
        metadata: {}
      }
    ];
    model.relationships = [
      {
        id: `rel_${dimensionTable}`,
        dimension_id: `dim_${dimensionTable}`,
        join_type: "left",
        key_pairs: [{ fact_column: "customer_id", dimension_column: "customer_id" }],
        metadata: {}
      }
    ];
  }
  if (businessRuleExpression.trim()) {
    model.business_rules = [
      {
        id: "rule_1",
        name: "business_rule_1",
        expression: businessRuleExpression.trim(),
        output_type: "unknown",
        metadata: {}
      }
    ];
  }
  return model;
}


function replaceModelConnection(model: DataModelDefinition, replacementConnectionId: string): DataModelDefinition {
  return {
    ...model,
    sources: model.sources.map((source) => ({ ...source, connection_id: replacementConnectionId })),
    fact_table: model.fact_table ? { ...model.fact_table, connection_id: replacementConnectionId } : null,
    dimensions: model.dimensions.map((dimension) => ({ ...dimension, connection_id: replacementConnectionId })),
    relationships: model.relationships.map((relationship) => ({ ...relationship })),
    business_rules: model.business_rules.map((rule) => ({ ...rule }))
  };
}
