from __future__ import annotations

from copy import deepcopy
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


class SchemaForeignKeyColumnPair(StrictModel):
    local_column: str
    referenced_column: str


class SchemaForeignKey(StrictModel):
    referenced_table: str
    column_pairs: list[SchemaForeignKeyColumnPair] = Field(default_factory=list)


class SchemaObject(StrictModel):
    name: str
    object_type: ObjectType
    columns: list[SchemaColumn] = Field(default_factory=list)
    foreign_keys: list[SchemaForeignKey] = Field(default_factory=list)


class ConnectionSchemaResponse(StrictModel):
    connection_id: str
    connection_label: str
    objects: list[SchemaObject] = Field(default_factory=list)


class SourceConnectionReference(StrictModel):
    connection_id: str
    alias: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class FactTableDefinition(StrictModel):
    id: str
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
    parent_column: str
    child_column: str


class RelationshipDefinition(StrictModel):
    id: str
    parent_table_id: str
    child_table_id: str
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
    schema_version: Literal[2]
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
    model: ModelDefinition = Field(default_factory=lambda: ModelDefinition(schema_version=2))


class DataModelUpdateRequest(StrictModel):
    name: str
    description: str | None = None
    model: ModelDefinition


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
    model: ModelDefinition = Field(default_factory=lambda: ModelDefinition(schema_version=2))


class DataModelTestResponse(StrictModel):
    succeeded: bool
    status: DataModelStatus
    errors: list[Diagnostic] = Field(default_factory=list)
    warnings: list[Diagnostic] = Field(default_factory=list)


def normalize_persisted_model_definition(raw_model: dict[str, Any]) -> ModelDefinition:
    data = deepcopy(raw_model)
    if data.get("schema_version") == 2:
        return ModelDefinition.model_validate(data)
    if "schema_version" in data:
        return ModelDefinition.model_validate(data)

    data["schema_version"] = 2
    dimensions = data.get("dimensions") or []
    used_ids = {item.get("id") for item in dimensions if isinstance(item, dict)}
    root_id = "fact_root"
    suffix = 1
    while root_id in used_ids:
        root_id = f"fact_root_{suffix}"
        suffix += 1

    relationships = data.get("relationships") or []
    fact = data.get("fact_table")
    if isinstance(fact, dict):
        fact["id"] = root_id
    elif relationships:
        data["fact_table"] = {
            "id": root_id,
            "connection_id": "",
            "table": "",
            "object_type": "table",
            "alias": "",
            "grain": None,
            "primary_key": [],
            "metadata": {"legacy_placeholder": True},
        }

    for relationship in relationships:
        relationship["parent_table_id"] = root_id
        relationship["child_table_id"] = relationship.pop("dimension_id")
        for pair in relationship.get("key_pairs", []):
            pair["parent_column"] = pair.pop("fact_column")
            pair["child_column"] = pair.pop("dimension_column")

    return ModelDefinition.model_validate(data)
