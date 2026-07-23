from app.modules.data_models.rule_parser import rewrite_alias_references, validate_business_rules
from app.modules.data_models.schemas import BusinessRuleDefinition


def rule(expression: str, *, rule_id: str = "rule_1", name: str = "risk_flag") -> BusinessRuleDefinition:
    return BusinessRuleDefinition(id=rule_id, name=name, expression=expression, output_type="integer")


def test_rule_parser_accepts_allowed_scalar_functions_and_known_references() -> None:
    result = validate_business_rules(
        [rule("case when fact.balance > 0 then coalesce(upper(customer.name), 'NA') else 'NONE' end")],
        table_columns={"fact": {"balance"}, "customer": {"name"}},
    )

    assert result.errors == []


def test_rule_parser_rejects_unsafe_input_unknown_functions_and_unknown_references() -> None:
    result = validate_business_rules(
        [
            rule("fact.balance; drop table loans", rule_id="rule_semicolon"),
            rule("randomblob(fact.balance)", rule_id="rule_function"),
            rule("missing_alias.balance", rule_id="rule_alias"),
            rule("fact.unknown_column", rule_id="rule_column"),
        ],
        table_columns={"fact": {"balance"}},
    )

    assert {error.code for error in result.errors} >= {"unsafe_rule_expression", "unsupported_rule_function", "unknown_rule_alias", "unknown_rule_column"}


def test_alias_rewrite_updates_relationships_and_business_rules_or_reports_ambiguity() -> None:
    model = {
        "relationships": [{"id": "rel_1", "metadata": {"fact_alias": "fact", "dimension_alias": "customer"}}],
        "business_rules": [
            {"id": "rule_1", "expression": "fact.balance + customer.limit"},
            {"id": "rule_2", "expression": "balance + customer.limit"},
        ],
    }

    updated, diagnostics = rewrite_alias_references(model, old_alias="fact", new_alias="loan_fact", known_columns={"fact": {"balance"}, "customer": {"limit"}})

    assert updated["relationships"][0]["metadata"]["fact_alias"] == "loan_fact"
    assert updated["business_rules"][0]["expression"] == "loan_fact.balance + customer.limit"
    assert diagnostics[0].code == "ambiguous_alias_rewrite"
