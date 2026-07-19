from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

from app.modules.data_models import diagnostics
from app.modules.data_models.schemas import Diagnostic, ModelDefinition

MAX_SOURCES = 5
MAX_DIMENSIONS = 25
MAX_BUSINESS_RULES = 50


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
    if len(model.dimensions) > MAX_DIMENSIONS:
        result.errors.append(diagnostics.error("too_many_dimensions", "A data model can contain at most 25 dimensions.", section="dimensions"))
    if len(model.business_rules) > MAX_BUSINESS_RULES:
        result.errors.append(diagnostics.error("too_many_business_rules", "A data model can contain at most 50 business rules.", section="business_rules"))
    if model.measures:
        result.errors.append(diagnostics.error("unsupported_measures", "Measures are not supported in this release.", section="measures"))
    if model.fact_table is None:
        result.errors.append(diagnostics.error("missing_fact_table", "Select one fact table before testing this model.", section="fact_table"))

    _append_duplicate_errors(result, [source.alias for source in model.sources], "duplicate_source_alias", "Source aliases must be unique.", "sources")
    _append_duplicate_errors(result, [dimension.id for dimension in model.dimensions], "duplicate_dimension_id", "Dimension IDs must be unique.", "dimensions")
    _append_duplicate_errors(result, [dimension.alias for dimension in model.dimensions], "duplicate_dimension_alias", "Dimension aliases must be unique.", "dimensions")
    _append_duplicate_errors(result, [relationship.id for relationship in model.relationships], "duplicate_relationship_id", "Relationship IDs must be unique.", "relationships")
    _append_duplicate_errors(result, [rule.id for rule in model.business_rules], "duplicate_business_rule_id", "Business rule IDs must be unique.", "business_rules")
    _append_duplicate_errors(result, [rule.name for rule in model.business_rules], "duplicate_business_rule_name", "Business rule names must be unique.", "business_rules")

    dimensions_by_id = {dimension.id: dimension for dimension in model.dimensions}
    related_dimension_ids: list[str] = []
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
    result.warnings.append(
        diagnostics.warning(
            "compile_only",
            "This test validates compilation only and does not validate row retention, fanout, unmatched dimensions, or cardinality.",
        )
    )
    return result


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
