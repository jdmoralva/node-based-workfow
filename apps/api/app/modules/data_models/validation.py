from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field

from app.modules.data_models import diagnostics
from app.modules.data_models.schemas import Diagnostic, DimensionDefinition, FactTableDefinition, ModelDefinition, RelationshipDefinition

MAX_SOURCES = 5
MAX_DIMENSIONS = 25
MAX_BUSINESS_RULES = 50

DRAFT_GAP_CODES = {
    "disconnected_table",
    "incomplete_business_rule",
    "incomplete_dimension",
    "incomplete_fact_table",
    "incomplete_relationship_keys",
    "missing_dimension_source",
    "missing_fact_table",
    "missing_fact_source",
    "missing_relationship_keys",
    "missing_sources",
    "missing_table_relationship",
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
    ordered_dimensions = sorted(model.dimensions, key=lambda item: item.id.casefold())
    ordered_business_rules = sorted(model.business_rules, key=lambda item: item.id.casefold())
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
    fact = model.fact_table
    if fact is None:
        result.errors.append(diagnostics.error("missing_fact_table", "Select one fact table before testing this model.", section="fact_table"))
    elif not fact.connection_id.strip() or not fact.table.strip() or not fact.alias.strip() or not fact.primary_key:
        result.errors.append(
            diagnostics.error(
                "incomplete_fact_table",
                "Complete the fact source, table, alias, and primary key before testing this model.",
                section="fact_table",
            )
        )
    elif fact.connection_id not in source_connection_ids:
        result.errors.append(diagnostics.error("missing_fact_source", "The fact table connection must be included in model sources.", section="fact_table"))
    if fact is not None and not fact.id.strip():
        result.errors.append(diagnostics.error("missing_table_id", "Fact and dimension IDs cannot be blank.", section="fact_table"))

    _append_duplicate_errors(result, [source.alias for source in model.sources], "duplicate_source_alias", "Source aliases must be unique.", "sources")
    table_ids = ([fact.id] if fact is not None else []) + [dimension.id for dimension in ordered_dimensions]
    table_aliases = ([fact.alias] if fact is not None else []) + [dimension.alias for dimension in ordered_dimensions]
    _append_duplicate_errors(result, table_ids, "duplicate_table_id", "Fact and dimension IDs must be unique.", "dimensions")
    _append_duplicate_errors(result, table_aliases, "duplicate_table_alias", "Fact and dimension aliases must be unique.", "dimensions")
    _append_duplicate_errors(result, [relationship.id for relationship in model.relationships], "duplicate_relationship_id", "Relationship IDs must be unique.", "relationships")
    _append_duplicate_errors(result, [rule.id for rule in ordered_business_rules], "duplicate_business_rule_id", "Business rule IDs must be unique.", "business_rules")
    _append_duplicate_errors(result, [rule.name for rule in ordered_business_rules], "duplicate_business_rule_name", "Business rule names must be unique.", "business_rules")

    for dimension in ordered_dimensions:
        if not dimension.id.strip():
            result.errors.append(
                diagnostics.error("missing_table_id", "Fact and dimension IDs cannot be blank.", section="dimensions")
            )
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

    tables_by_id: dict[str, FactTableDefinition | DimensionDefinition] = {
        dimension.id: dimension for dimension in ordered_dimensions
    }
    if fact is not None:
        tables_by_id[fact.id] = fact
    valid_relationships: list[RelationshipDefinition] = []
    incoming: dict[str, list[RelationshipDefinition]] = defaultdict(list)
    endpoint_pairs: list[str] = []
    ordered_relationships = sorted(model.relationships, key=_relationship_sort_key)
    for relationship in ordered_relationships:
        if not relationship.id.strip():
            result.errors.append(
                diagnostics.error("missing_relationship_id", "Relationship IDs cannot be blank.", section="relationships")
            )
        parent = tables_by_id.get(relationship.parent_table_id)
        child = tables_by_id.get(relationship.child_table_id)
        if parent is None or child is None:
            result.errors.append(
                diagnostics.error(
                    "unknown_relationship_endpoint",
                    "Relationships must reference two configured table instances.",
                    section="relationships",
                    id=relationship.id,
                )
            )
        elif relationship.parent_table_id == relationship.child_table_id:
            result.errors.append(
                diagnostics.error("self_relationship", "A table cannot be related to itself.", section="relationships", id=relationship.id)
            )
        else:
            valid_relationships.append(relationship)
            incoming[relationship.child_table_id].append(relationship)
            endpoint_pairs.append(f"{relationship.parent_table_id}\0{relationship.child_table_id}")
            if fact is not None and relationship.child_table_id == fact.id:
                result.errors.append(
                    diagnostics.error(
                        "incoming_fact_relationship",
                        "The fact root cannot have an incoming relationship.",
                        section="relationships",
                        id=relationship.id,
                    )
                )
        if not relationship.key_pairs:
            result.errors.append(diagnostics.error("missing_relationship_keys", "Relationships require at least one join key pair.", section="relationships", id=relationship.id))
        elif any(not pair.parent_column.strip() or not pair.child_column.strip() for pair in relationship.key_pairs):
            result.errors.append(
                diagnostics.error(
                    "incomplete_relationship_keys",
                    "Select both columns for every relationship key pair.",
                    section="relationships",
                    id=relationship.id,
                )
            )

    _append_duplicate_errors(result, endpoint_pairs, "duplicate_relationship_endpoints", "The same parent and child can be related only once.", "relationships")
    for child_id, relationships in incoming.items():
        if len(relationships) > 1:
            result.errors.append(
                diagnostics.error(
                    "multiple_table_parents",
                    "Every dimension can have only one incoming relationship.",
                    section="relationships",
                    id=child_id,
                )
            )

    incoming_ids = set(incoming)
    for dimension in ordered_dimensions:
        if dimension.id not in incoming_ids:
            result.errors.append(
                diagnostics.error(
                    "missing_table_relationship",
                    "Every dimension requires one relationship on a path to the fact root.",
                    section="relationships",
                    id=dimension.id,
                )
            )

    children_by_parent: dict[str, list[str]] = defaultdict(list)
    for relationship in valid_relationships:
        children_by_parent[relationship.parent_table_id].append(relationship.child_table_id)
    if _has_cycle(table_ids, children_by_parent):
        result.errors.append(diagnostics.error("relationship_cycle", "Relationships must form an acyclic rooted tree.", section="relationships"))

    reachable = _reachable_from(fact.id, children_by_parent) if fact is not None else set()
    for dimension in ordered_dimensions:
        if dimension.id not in reachable:
            result.errors.append(
                diagnostics.error(
                    "disconnected_table",
                    "Every dimension must have one path to the fact root.",
                    section="relationships",
                    id=dimension.id,
                )
            )

    parent_by_child = {
        relationship.child_table_id: relationship.parent_table_id
        for relationship in valid_relationships
        if len(incoming[relationship.child_table_id]) == 1
    }
    aliases_by_id = {table_id: table.alias for table_id, table in tables_by_id.items()}
    for relationship in ordered_relationships:
        if relationship.join_type == "inner":
            path = _alias_path(relationship.child_table_id, parent_by_child, aliases_by_id)
            result.warnings.append(
                diagnostics.warning(
                    "inner_join_filters_fact",
                    f"Inner join on {path} can filter fact rows; compile-only testing cannot measure row retention.",
                    section="relationships",
                    id=relationship.id,
                )
            )

    for rule in ordered_business_rules:
        if not rule.id.strip():
            result.errors.append(
                diagnostics.error("missing_business_rule_id", "Business rule IDs cannot be blank.", section="business_rules")
            )
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
            "This test validates compilation only and does not validate multi-hop filtering, row retention, fanout, unmatched dimensions, or cardinality.",
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


def _relationship_sort_key(relationship: RelationshipDefinition) -> tuple[str, str, str]:
    return (
        relationship.parent_table_id.casefold(),
        relationship.child_table_id.casefold(),
        relationship.id.casefold(),
    )


def _has_cycle(table_ids: list[str], children_by_parent: dict[str, list[str]]) -> bool:
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(table_id: str) -> bool:
        if table_id in visiting:
            return True
        if table_id in visited:
            return False
        visiting.add(table_id)
        if any(visit(child_id) for child_id in children_by_parent.get(table_id, [])):
            return True
        visiting.remove(table_id)
        visited.add(table_id)
        return False

    return any(visit(table_id) for table_id in dict.fromkeys(table_ids))


def _reachable_from(root_id: str, children_by_parent: dict[str, list[str]]) -> set[str]:
    reachable: set[str] = set()
    pending = [root_id]
    while pending:
        parent_id = pending.pop()
        for child_id in children_by_parent.get(parent_id, []):
            if child_id not in reachable:
                reachable.add(child_id)
                pending.append(child_id)
    return reachable


def _alias_path(child_id: str, parent_by_child: dict[str, str], aliases_by_id: dict[str, str]) -> str:
    path: list[str] = []
    seen: set[str] = set()
    current = child_id
    while current not in seen:
        seen.add(current)
        path.append(aliases_by_id.get(current, current))
        if current not in parent_by_child:
            break
        current = parent_by_child[current]
    return " -> ".join(reversed(path))
