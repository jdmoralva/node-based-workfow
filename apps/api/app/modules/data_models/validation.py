from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from app.modules.data_models import diagnostics
from app.modules.data_models.schemas import Diagnostic, ModelDefinition

MAX_SOURCES = 5
MAX_DIMENSIONS = 25
MAX_BUSINESS_RULES = 50

DRAFT_GAP_CODES = {
    "incomplete_business_rule",
    "incomplete_dimension",
    "incomplete_fact_table",
    "incomplete_relationship_keys",
    "missing_dimension_relationship",
    "missing_dimension_source",
    "missing_fact_table",
    "missing_fact_source",
    "missing_relationship_keys",
    "missing_sources",
}


@dataclass
class ValidationResult:
    errors: list[Diagnostic] = field(default_factory=list)
    warnings: list[Diagnostic] = field(default_factory=list)

    @property
    def succeeded(self) -> bool:
        return not self.errors


def validate_model_definition(model: ModelDefinition) -> ValidationResult:
    result = ValidationResult()
    if len(model.sources) > MAX_SOURCES:
        result.errors.append(diagnostics.error("too_many_sources", "A data model can reference at most 5 sources.", section="sources"))
    if not model.sources:
        result.errors.append(diagnostics.error("missing_sources", "Add at least one source connection before testing this model.", section="sources"))
    if len(model.dimensions) > MAX_DIMENSIONS:
        result.errors.append(diagnostics.error("too_many_dimensions", "A data model can contain at most 25 dimensions.", section="dimensions"))
    if len(model.business_rules) > MAX_BUSINESS_RULES:
        result.errors.append(diagnostics.error("too_many_business_rules", "A data model can contain at most 50 business rules.", section="business_rules"))
    if model.measures:
        result.errors.append(diagnostics.error("unsupported_measures", "Measures are not supported in this release.", section="measures"))
    source_connection_ids = {source.connection_id for source in model.sources}
    if model.fact_table is None:
        result.errors.append(diagnostics.error("missing_fact_table", "Select one fact table before testing this model.", section="fact_table"))
    elif not model.fact_table.connection_id.strip() or not model.fact_table.table.strip() or not model.fact_table.alias.strip() or not model.fact_table.primary_key:
        result.errors.append(
            diagnostics.error(
                "incomplete_fact_table",
                "Complete the fact source, table, alias, and primary key before testing this model.",
                section="fact_table",
            )
        )
    elif model.fact_table.connection_id not in source_connection_ids:
        result.errors.append(
            diagnostics.error("missing_fact_source", "The fact table connection must be included in model sources.", section="fact_table")
        )

    _append_duplicate_errors(result, [source.alias for source in model.sources], "duplicate_source_alias", "Source aliases must be unique.", "sources")
    _append_duplicate_errors(result, [dimension.id for dimension in model.dimensions], "duplicate_dimension_id", "Dimension IDs must be unique.", "dimensions")
    _append_duplicate_errors(result, [dimension.alias for dimension in model.dimensions], "duplicate_dimension_alias", "Dimension aliases must be unique.", "dimensions")
    _append_duplicate_errors(result, [relationship.id for relationship in model.relationships], "duplicate_relationship_id", "Relationship IDs must be unique.", "relationships")
    _append_duplicate_errors(result, [rule.id for rule in model.business_rules], "duplicate_business_rule_id", "Business rule IDs must be unique.", "business_rules")
    _append_duplicate_errors(result, [rule.name for rule in model.business_rules], "duplicate_business_rule_name", "Business rule names must be unique.", "business_rules")

    dimensions_by_id = {dimension.id: dimension for dimension in model.dimensions}
    related_dimension_ids: list[str] = []
    for dimension in model.dimensions:
        if not dimension.connection_id.strip() or not dimension.table.strip() or not dimension.alias.strip() or not dimension.primary_key:
            result.errors.append(
                diagnostics.error(
                    "incomplete_dimension",
                    "Complete each dimension source, table, alias, and primary key before testing this model.",
                    section="dimensions",
                    id=dimension.id,
                )
            )
        if dimension.connection_id not in source_connection_ids:
            result.errors.append(
                diagnostics.error(
                    "missing_dimension_source",
                    "Every dimension connection must be included in model sources.",
                    section="dimensions",
                    id=dimension.id,
                )
            )
    for relationship in model.relationships:
        dimension = dimensions_by_id.get(relationship.dimension_id)
        if dimension is None:
            result.errors.append(
                diagnostics.error("unknown_relationship_dimension", "Relationships must reference an existing dimension.", section="relationships", id=relationship.id)
            )
            continue
        related_dimension_ids.append(dimension.id)
        if not relationship.key_pairs:
            result.errors.append(diagnostics.error("missing_relationship_keys", "Relationships require at least one join key pair.", section="relationships", id=relationship.id))
        elif any(not pair.fact_column.strip() or not pair.dimension_column.strip() for pair in relationship.key_pairs):
            result.errors.append(
                diagnostics.error(
                    "incomplete_relationship_keys",
                    "Select both columns for every relationship key pair.",
                    section="relationships",
                    id=relationship.id,
                )
            )
        if relationship.join_type == "inner":
            result.warnings.append(
                diagnostics.warning(
                    "inner_join_filters_fact",
                    "Inner joins can filter fact rows; this test does not validate row retention.",
                    section="relationships",
                    id=relationship.id,
                )
            )

    _append_duplicate_errors(result, related_dimension_ids, "duplicate_dimension_relationship", "Each dimension can have at most one fact relationship.", "relationships")
    for dimension in model.dimensions:
        if dimension.id not in related_dimension_ids:
            result.errors.append(
                diagnostics.error(
                    "missing_dimension_relationship",
                    "Every dimension requires one direct relationship to the fact table.",
                    section="relationships",
                    id=dimension.id,
                )
            )
    for rule in model.business_rules:
        if not rule.name.strip() or not rule.expression.strip():
            result.errors.append(
                diagnostics.error(
                    "incomplete_business_rule",
                    "Complete each business rule name and expression before testing this model.",
                    section="business_rules",
                    id=rule.id,
                )
            )
    result.warnings.append(
        diagnostics.warning(
            "compile_only",
            "This test validates compilation only and does not validate row retention, fanout, unmatched dimensions, or cardinality.",
        )
    )
    return result


def blocking_save_errors(result: ValidationResult) -> list[Diagnostic]:
    return [item for item in result.errors if item.code not in DRAFT_GAP_CODES]


def replace_connection_references(model: ModelDefinition, *, old_connection_id: str, new_connection_id: str) -> ModelDefinition:
    data = model.model_dump(mode="json")
    for source in data["sources"]:
        if source["connection_id"] == old_connection_id:
            source["connection_id"] = new_connection_id
    if data["fact_table"] is not None and data["fact_table"]["connection_id"] == old_connection_id:
        data["fact_table"]["connection_id"] = new_connection_id
    for dimension in data["dimensions"]:
        if dimension["connection_id"] == old_connection_id:
            dimension["connection_id"] = new_connection_id
    return ModelDefinition.model_validate(data)


def _append_duplicate_errors(result: ValidationResult, values: list[str], code: str, message: str, section: str) -> None:
    seen = Counter(value.strip().casefold() for value in values if value and value.strip())
    if any(count > 1 for count in seen.values()):
        result.errors.append(diagnostics.error(code, message, section=section))
