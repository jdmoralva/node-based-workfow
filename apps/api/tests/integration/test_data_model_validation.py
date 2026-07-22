from app.modules.data_models.schemas import BusinessRuleDefinition, ModelDefinition
from app.modules.data_models.validation import blocking_save_errors, validate_model_definition


def base_model() -> ModelDefinition:
    return ModelDefinition.model_validate(
        {
            "schema_version": 2,
            "sources": [{"connection_id": "conn_1", "alias": "portfolio"}],
            "fact_table": {
                "id": "fact_sales",
                "connection_id": "conn_1",
                "table": "invoice_lines",
                "object_type": "table",
                "alias": "fact_sales",
                "primary_key": ["id"],
            },
            "dimensions": [
                {
                    "id": "dim_invoice",
                    "connection_id": "conn_1",
                    "table": "invoices",
                    "object_type": "table",
                    "alias": "invoice",
                    "primary_key": ["invoice_id"],
                },
                {
                    "id": "dim_customer_current",
                    "connection_id": "conn_1",
                    "table": "customers",
                    "object_type": "table",
                    "alias": "customer_current",
                    "primary_key": ["customer_id"],
                },
                {
                    "id": "dim_customer_prior",
                    "connection_id": "conn_1",
                    "table": "customers",
                    "object_type": "table",
                    "alias": "customer_prior",
                    "primary_key": ["customer_id"],
                },
            ],
            "relationships": [
                {
                    "id": "rel_invoice",
                    "parent_table_id": "fact_sales",
                    "child_table_id": "dim_invoice",
                    "join_type": "left",
                    "key_pairs": [{"parent_column": "invoice_id", "child_column": "invoice_id"}],
                },
                {
                    "id": "rel_customer_current",
                    "parent_table_id": "dim_invoice",
                    "child_table_id": "dim_customer_current",
                    "join_type": "inner",
                    "key_pairs": [
                        {"parent_column": "customer_id", "child_column": "customer_id"},
                        {"parent_column": "region_id", "child_column": "region_id"},
                    ],
                },
                {
                    "id": "rel_customer_prior",
                    "parent_table_id": "fact_sales",
                    "child_table_id": "dim_customer_prior",
                    "join_type": "left",
                    "key_pairs": [{"parent_column": "prior_customer_id", "child_column": "customer_id"}],
                },
            ],
            "business_rules": [],
            "measures": [],
            "metadata": {},
        }
    )


def test_validation_allows_rooted_snowflake_role_playing_dimensions_and_composite_keys() -> None:
    result = validate_model_definition(base_model())

    assert result.errors == []
    assert [warning.code for warning in result.warnings] == ["inner_join_filters_fact", "compile_only"]
    assert "fact_sales -> invoice -> customer_current" in result.warnings[0].message


def test_validation_rejects_duplicate_aliases_non_empty_measures_caps_and_missing_relationship_keys() -> None:
    model = base_model()
    model.dimensions[2].alias = "CUSTOMER_CURRENT"
    model.measures = [{"name": "balance"}]
    model.sources = model.sources * 6
    model.relationships[0].key_pairs = []

    result = validate_model_definition(model)

    assert {error.code for error in result.errors} >= {
        "too_many_sources",
        "duplicate_table_alias",
        "unsupported_measures",
        "missing_relationship_keys",
    }


def test_validation_rejects_cycles_multiple_parents_incoming_fact_and_unknown_endpoints() -> None:
    model = base_model()
    model.relationships.extend(
        [
            model.relationships[0].model_copy(
                update={"id": "rel_second_parent", "parent_table_id": "dim_customer_prior", "child_table_id": "dim_invoice"}
            ),
            model.relationships[0].model_copy(
                update={"id": "rel_cycle", "parent_table_id": "dim_customer_current", "child_table_id": "fact_sales"}
            ),
            model.relationships[0].model_copy(
                update={"id": "rel_unknown", "parent_table_id": "missing", "child_table_id": "dim_invoice"}
            ),
        ]
    )

    result = validate_model_definition(model)

    assert {error.code for error in result.errors} >= {
        "multiple_table_parents",
        "incoming_fact_relationship",
        "relationship_cycle",
        "unknown_relationship_endpoint",
    }
    assert {error.code for error in blocking_save_errors(result)} >= {
        "multiple_table_parents",
        "incoming_fact_relationship",
        "unknown_relationship_endpoint",
    }


def test_validation_saves_disconnected_dimensions_as_repairable_draft_gaps() -> None:
    model = base_model()
    model.relationships = [relationship for relationship in model.relationships if relationship.id != "rel_invoice"]

    result = validate_model_definition(model)

    assert {error.code for error in result.errors} >= {"missing_table_relationship", "disconnected_table"}
    assert blocking_save_errors(result) == []


def test_validation_blocks_blank_stable_table_and_relationship_ids() -> None:
    model = base_model()
    assert model.fact_table is not None
    model.fact_table.id = ""
    model.dimensions[0].id = ""
    model.relationships[0].id = ""
    model.relationships[0].parent_table_id = ""
    model.relationships[0].child_table_id = ""

    result = validate_model_definition(model)

    assert {error.code for error in result.errors} >= {"missing_table_id", "missing_relationship_id"}
    assert {error.code for error in blocking_save_errors(result)} >= {"missing_table_id", "missing_relationship_id"}


def test_validation_diagnostics_do_not_depend_on_relationship_array_order() -> None:
    model = base_model()
    for dimension in model.dimensions:
        dimension.primary_key = []
    for relationship in model.relationships:
        relationship.join_type = "inner"
        relationship.key_pairs = []
    model.business_rules = [
        BusinessRuleDefinition(id="rule_z", name="", expression=""),
        BusinessRuleDefinition(id="rule_a", name="", expression=""),
    ]

    forward = validate_model_definition(model)
    model.dimensions.reverse()
    model.relationships.reverse()
    model.business_rules.reverse()
    reversed_result = validate_model_definition(model)

    assert [item.model_dump(mode="json") for item in forward.errors] == [
        item.model_dump(mode="json") for item in reversed_result.errors
    ]
    assert [item.model_dump(mode="json") for item in forward.warnings] == [
        item.model_dump(mode="json") for item in reversed_result.warnings
    ]
