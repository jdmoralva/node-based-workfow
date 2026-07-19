from app.modules.data_models.schemas import ModelDefinition
from app.modules.data_models.validation import validate_model_definition


def base_model() -> ModelDefinition:
    return ModelDefinition.model_validate(
        {
            "sources": [{"connection_id": "conn_1", "alias": "portfolio"}],
            "fact_table": {"connection_id": "conn_1", "table": "loans", "object_type": "table", "alias": "fact", "primary_key": ["id"]},
            "dimensions": [
                {"id": "dim_customer_current", "connection_id": "conn_1", "table": "customers", "object_type": "table", "alias": "customer_current", "primary_key": ["customer_id"]},
                {"id": "dim_customer_prior", "connection_id": "conn_1", "table": "customers", "object_type": "table", "alias": "customer_prior", "primary_key": ["customer_id"]},
            ],
            "relationships": [
                {
                    "id": "rel_customer_current",
                    "dimension_id": "dim_customer_current",
                    "join_type": "left",
                    "key_pairs": [{"fact_column": "customer_id", "dimension_column": "customer_id"}],
                },
                {
                    "id": "rel_customer_prior",
                    "dimension_id": "dim_customer_prior",
                    "join_type": "inner",
                    "key_pairs": [
                        {"fact_column": "prior_customer_id", "dimension_column": "customer_id"},
                        {"fact_column": "region_id", "dimension_column": "region_id"},
                    ],
                },
            ],
            "business_rules": [],
            "measures": [],
            "metadata": {},
        }
    )


def test_validation_allows_role_playing_dimensions_and_composite_keys_with_inner_join_warning() -> None:
    result = validate_model_definition(base_model())

    assert result.errors == []
    assert [warning.code for warning in result.warnings] == ["inner_join_filters_fact", "compile_only"]


def test_validation_rejects_duplicate_aliases_non_empty_measures_caps_and_missing_relationship_keys() -> None:
    model = base_model()
    model.dimensions[1].alias = "customer_current"
    model.measures = [{"name": "balance"}]
    model.sources = model.sources * 6
    model.relationships[0].key_pairs = []

    result = validate_model_definition(model)

    assert {error.code for error in result.errors} >= {"too_many_sources", "duplicate_dimension_alias", "unsupported_measures", "missing_relationship_keys"}


def test_validation_rejects_snowflake_relationships_and_duplicate_ids() -> None:
    model = base_model()
    model.dimensions[1].id = "dim_customer_current"
    model.relationships[1].dimension_id = "unknown_dimension"

    result = validate_model_definition(model)

    assert {error.code for error in result.errors} >= {"duplicate_dimension_id", "unknown_relationship_dimension"}
