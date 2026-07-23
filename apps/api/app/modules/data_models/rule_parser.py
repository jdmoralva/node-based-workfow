from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Any

from app.modules.data_models import diagnostics
from app.modules.data_models.schemas import BusinessRuleDefinition, Diagnostic

ALLOWED_FUNCTIONS = {"abs", "coalesce", "ifnull", "lower", "ltrim", "max", "min", "nullif", "round", "rtrim", "substr", "trim", "upper"}
UNSAFE_TOKENS = re.compile(r";|--|/\*|\*/", re.IGNORECASE)
FUNCTION_CALL = re.compile(r"\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(")
QUALIFIED_COLUMN = re.compile(r"\b([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\b")
SQL_KEYWORDS = {"case", "when", "then", "else", "end"}


@dataclass
class RuleValidationResult:
    errors: list[Diagnostic] = field(default_factory=list)


def validate_business_rules(rules: list[BusinessRuleDefinition], *, table_columns: dict[str, set[str]]) -> RuleValidationResult:
    result = RuleValidationResult()
    for rule in sorted(rules, key=lambda item: item.id.casefold()):
        if UNSAFE_TOKENS.search(rule.expression):
            result.errors.append(diagnostics.error("unsafe_rule_expression", "Business rule expressions cannot contain statements or comments.", section="business_rules", id=rule.id))
            continue
        for function_name in FUNCTION_CALL.findall(rule.expression):
            name = function_name.casefold()
            if name not in ALLOWED_FUNCTIONS and name not in SQL_KEYWORDS:
                result.errors.append(diagnostics.error("unsupported_rule_function", "Business rule uses an unsupported function.", section="business_rules", id=rule.id))
        for alias, column_name in QUALIFIED_COLUMN.findall(rule.expression):
            if alias not in table_columns:
                result.errors.append(diagnostics.error("unknown_rule_alias", "Business rule references an unknown table alias.", section="business_rules", id=rule.id))
            elif column_name not in table_columns[alias]:
                result.errors.append(diagnostics.error("unknown_rule_column", "Business rule references an unknown column.", section="business_rules", id=rule.id))
    return result


def rewrite_alias_references(model: dict[str, Any], *, old_alias: str, new_alias: str, known_columns: dict[str, set[str]]) -> tuple[dict[str, Any], list[Diagnostic]]:
    diagnostics_out: list[Diagnostic] = []
    updated = _copy_model(model)
    for relationship in updated.get("relationships", []):
        metadata = relationship.get("metadata") or {}
        for key in ("fact_alias", "dimension_alias"):
            if metadata.get(key) == old_alias:
                metadata[key] = new_alias
        relationship["metadata"] = metadata

    ambiguous_columns = known_columns.get(old_alias, set())
    for rule in updated.get("business_rules", []):
        expression = rule.get("expression", "")
        rule["expression"] = re.sub(rf"\b{re.escape(old_alias)}\.", f"{new_alias}.", expression)
        for column in ambiguous_columns:
            if re.search(rf"(?<!\.)\b{re.escape(column)}\b", expression):
                diagnostics_out.append(
                    diagnostics.warning("ambiguous_alias_rewrite", "A business rule contains an unqualified column that could not be rewritten safely.", section="business_rules", id=rule.get("id"))
                )
                break
    return updated, diagnostics_out


def _copy_model(model: dict[str, Any]) -> dict[str, Any]:
    return {
        key: [item.copy() if isinstance(item, dict) else item for item in value] if isinstance(value, list) else value
        for key, value in model.items()
    }
