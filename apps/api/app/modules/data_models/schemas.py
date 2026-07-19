from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

DataModelStatus = Literal["draft", "untested", "tested", "failed", "stale"]
DiagnosticSeverity = Literal["error", "warning"]
ObjectType = Literal["table", "view"]
JoinType = Literal["left", "inner"]
BusinessRuleOutputType = Literal["text", "integer", "real", "numeric", "boolean", "date", "datetime", "unknown"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Diagnostic(StrictModel):
    severity: DiagnosticSeverity
    code: str
    message: str
    location: dict[str, Any] | None = None
    stale: bool = False


class SchemaColumn(StrictModel):
    name: str
    declared_type: str | None = None
    nullable: bool | None = None
    primary_key: bool = False


class SchemaObject(StrictModel):
    name: str
    object_type: ObjectType
    columns: list[SchemaColumn] = Field(default_factory=list)


class ConnectionSchemaResponse(StrictModel):
    connection_id: str
    connection_label: str
    objects: list[SchemaObject] = Field(default_factory=list)


class SourceConnectionReference(StrictModel):
    connection_id: str
    alias: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class FactTableDefinition(StrictModel):
    connection_id: str
    table: str
    object_type: ObjectType
    alias: str
    grain: str | None = None
    primary_key: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class DimensionDefinition(StrictModel):
    id: str
    connection_id: str
    table: str
    object_type: ObjectType
    alias: str
    primary_key: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class KeyPairDefinition(StrictModel):
    fact_column: str
    dimension_column: str


class RelationshipDefinition(StrictModel):
    id: str
    dimension_id: str
    join_type: JoinType = "left"
    key_pairs: list[KeyPairDefinition] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class BusinessRuleDefinition(StrictModel):
    id: str
    name: str
    expression: str
    output_type: BusinessRuleOutputType = "unknown"
    metadata: dict[str, Any] = Field(default_factory=dict)


class ModelDefinition(StrictModel):
    sources: list[SourceConnectionReference] = Field(default_factory=list)
    fact_table: FactTableDefinition | None = None
    dimensions: list[DimensionDefinition] = Field(default_factory=list)
    relationships: list[RelationshipDefinition] = Field(default_factory=list)
    business_rules: list[BusinessRuleDefinition] = Field(default_factory=list)
    measures: list[Any] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class DataModelCreateRequest(StrictModel):
    name: str
    description: str | None = None
    model: ModelDefinition = Field(default_factory=ModelDefinition)


class DataModelUpdateRequest(StrictModel):
    name: str
    description: str | None = None
    model: ModelDefinition = Field(default_factory=ModelDefinition)


class SavedDataModelSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None = None
    test_status: DataModelStatus
    diagnostics_stale: bool
    last_tested_at: datetime | None = None
    last_test_succeeded_at: datetime | None = None
    last_test_failed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class SavedDataModelsResponse(StrictModel):
    items: list[SavedDataModelSummary]


class SavedDataModelResponse(SavedDataModelSummary):
    model: ModelDefinition
    last_test_errors: list[Diagnostic] = Field(default_factory=list)
    last_test_warnings: list[Diagnostic] = Field(default_factory=list)


class DataModelTestRequest(StrictModel):
    model: ModelDefinition = Field(default_factory=ModelDefinition)


class DataModelTestResponse(StrictModel):
    succeeded: bool
    status: DataModelStatus
    errors: list[Diagnostic] = Field(default_factory=list)
    warnings: list[Diagnostic] = Field(default_factory=list)
