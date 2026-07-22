export type DataModelStatus = "draft" | "untested" | "tested" | "failed" | "stale";

export type DiagnosticSeverity = "error" | "warning";

export type MissingConnectionDiagnosticLocation = {
  section: "sources";
  connection_id: string;
};

export type DataModelDiagnosticLocation = MissingConnectionDiagnosticLocation | Record<string, unknown>;

export type DataModelDiagnostic = {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  location: DataModelDiagnosticLocation | null;
  stale: boolean;
};

export type DataModelSchemaColumn = {
  name: string;
  declared_type: string | null;
  nullable: boolean | null;
  primary_key: boolean;
};

export type DataModelSchemaObject = {
  name: string;
  object_type: "table" | "view";
  columns: DataModelSchemaColumn[];
  foreign_keys?: Array<{
    referenced_table: string;
    column_pairs: Array<{
      local_column: string;
      referenced_column: string;
    }>;
  }>;
};

export type DataModelConnectionSchemaResponse = {
  connection_id: string;
  connection_label: string;
  objects: DataModelSchemaObject[];
};

export type DataModelSource = {
  connection_id: string;
  alias: string;
  metadata?: Record<string, unknown>;
};

export type DataModelFactTable = {
  id: string;
  connection_id: string;
  table: string;
  object_type: "table" | "view";
  alias: string;
  grain?: string | null;
  primary_key: string[];
  metadata?: Record<string, unknown>;
};

export type DataModelDimension = {
  id: string;
  connection_id: string;
  table: string;
  object_type: "table" | "view";
  alias: string;
  primary_key: string[];
  metadata?: Record<string, unknown>;
};

export type DataModelRelationship = {
  id: string;
  parent_table_id: string;
  child_table_id: string;
  join_type: "left" | "inner";
  key_pairs: Array<{
    parent_column: string;
    child_column: string;
  }>;
  metadata?: Record<string, unknown>;
};

export type DataModelBusinessRule = {
  id: string;
  name: string;
  expression: string;
  output_type: "text" | "integer" | "real" | "numeric" | "boolean" | "date" | "datetime" | "unknown";
  metadata?: Record<string, unknown>;
};

export type DataModelDefinition = {
  schema_version: 2;
  sources: DataModelSource[];
  fact_table: DataModelFactTable | null;
  dimensions: DataModelDimension[];
  relationships: DataModelRelationship[];
  business_rules: DataModelBusinessRule[];
  measures: unknown[];
  metadata?: Record<string, unknown>;
};

export type DataModelCreatePayload = {
  name: string;
  description?: string | null;
  model?: DataModelDefinition;
};

export type DataModelUpdatePayload = {
  name: string;
  description?: string | null;
  model: DataModelDefinition;
};

export type SavedDataModelSummary = {
  id: string;
  name: string;
  description: string | null;
  test_status: DataModelStatus;
  diagnostics_stale: boolean;
  last_tested_at: string | null;
  last_test_succeeded_at: string | null;
  last_test_failed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedDataModelsResponse = {
  items: SavedDataModelSummary[];
};

export type SavedDataModel = SavedDataModelSummary & {
  model: DataModelDefinition;
  last_test_errors: DataModelDiagnostic[];
  last_test_warnings: DataModelDiagnostic[];
};

export type DataModelTestPayload = {
  model: DataModelDefinition;
};

export type DataModelTestResponse = {
  succeeded: boolean;
  status: DataModelStatus;
  errors: DataModelDiagnostic[];
  warnings: DataModelDiagnostic[];
};
