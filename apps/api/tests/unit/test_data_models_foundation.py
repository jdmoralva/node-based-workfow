import pytest
from pydantic import ValidationError

from app.db.base import Base
from app.modules.data_models import diagnostics, repository, schemas as data_model_schemas, status
from app.modules.data_models.models import AnalyticalDataModel
from app.modules.data_models.schemas import (
    DataModelCreateRequest,
    FactTableDefinition,
    ModelDefinition,
    SourceConnectionReference,
)


def test_analytical_data_model_metadata_matches_foundational_contract() -> None:
    table = Base.metadata.tables["analytical_data_models"]

    assert table.c.id.primary_key
    assert table.c.user_id.foreign_keys
    assert table.c.normalized_name.index
    assert table.c.model_json.nullable is False
    assert table.c.test_status.default.arg == "draft"
    assert {constraint.name for constraint in table.constraints} >= {"uq_analytical_data_models_user_normalized_name"}


def test_model_definition_schema_defaults_and_rejects_unknown_core_keys() -> None:
    payload = DataModelCreateRequest(name=" Portfolio Star ")

    assert payload.name == " Portfolio Star "
    assert payload.model == ModelDefinition(schema_version=2)
    assert payload.model.schema_version == 2
    assert payload.model.measures == []

    try:
        ModelDefinition(schema_version=2, sources=[], snowflake_relationships=[])
    except ValidationError as exc:
        assert "snowflake_relationships" in str(exc)
    else:
        raise AssertionError("unknown model definition keys must be rejected")

    with pytest.raises(ValidationError):
        ModelDefinition.model_validate({"sources": [], "dimensions": [], "relationships": []})


def test_persisted_v1_definition_normalizes_to_explicit_v2_endpoints() -> None:
    normalized = data_model_schemas.normalize_persisted_model_definition(
        {
            "sources": [{"connection_id": "conn_1", "alias": "source"}],
            "fact_table": {
                "connection_id": "conn_1",
                "table": "loans",
                "object_type": "table",
                "alias": "fact",
                "primary_key": ["id"],
            },
            "dimensions": [
                {
                    "id": "dim_customer",
                    "connection_id": "conn_1",
                    "table": "customers",
                    "object_type": "table",
                    "alias": "customer",
                    "primary_key": ["id"],
                }
            ],
            "relationships": [
                {
                    "id": "rel_customer",
                    "dimension_id": "dim_customer",
                    "join_type": "left",
                    "key_pairs": [{"fact_column": "customer_id", "dimension_column": "id"}],
                }
            ],
        }
    )

    assert normalized.schema_version == 2
    assert normalized.fact_table is not None
    assert normalized.fact_table.id == "fact_root"
    assert normalized.relationships[0].parent_table_id == "fact_root"
    assert normalized.relationships[0].child_table_id == "dim_customer"
    assert normalized.relationships[0].key_pairs[0].parent_column == "customer_id"
    assert normalized.relationships[0].key_pairs[0].child_column == "id"
    assert data_model_schemas.normalize_persisted_model_definition(normalized.model_dump(mode="json")) == normalized


def test_persisted_factless_v1_draft_uses_a_collision_free_placeholder() -> None:
    normalized = data_model_schemas.normalize_persisted_model_definition(
        {
            "sources": [],
            "fact_table": None,
            "dimensions": [
                {
                    "id": "fact_root",
                    "connection_id": "",
                    "table": "customers",
                    "object_type": "table",
                    "alias": "customer",
                    "primary_key": [],
                }
            ],
            "relationships": [
                {"id": "rel_customer", "dimension_id": "fact_root", "join_type": "left", "key_pairs": []}
            ],
        }
    )

    assert normalized.fact_table is not None
    assert normalized.fact_table.id == "fact_root_1"
    assert normalized.fact_table.metadata == {"legacy_placeholder": True}
    assert normalized.relationships[0].parent_table_id == "fact_root_1"


def test_diagnostics_and_status_helpers_are_safe_and_deterministic() -> None:
    diagnostic = diagnostics.error("missing_fact_table", "Select one fact table before testing this model.", section="fact_table")

    assert diagnostic.severity == "error"
    assert diagnostic.location == {"section": "fact_table"}
    assert diagnostics.safe_error_message(ValueError("near SELECT * FROM C:/secret/portfolio.db")) == "Data model operation failed."
    assert status.calculate_saved_status(ModelDefinition(schema_version=2)) == "draft"
    assert status.calculate_saved_status(
        ModelDefinition(
            schema_version=2,
            sources=[SourceConnectionReference(connection_id="conn_1", alias="source")],
            fact_table=FactTableDefinition(
                id="fact_1", connection_id="conn_1", table="loans", object_type="table", alias="f", primary_key=["account_id"]
            )
        )
    ) == "untested"
    assert status.mark_after_saved_edit(previous_status="tested", model=ModelDefinition(schema_version=2)) == "draft"


def test_repository_ownership_helper_returns_only_current_users_model(db_session, data_model_user) -> None:
    owned = AnalyticalDataModel(
        user_id=data_model_user.id,
        name="Portfolio Star",
        normalized_name="portfolio star",
        model_json=ModelDefinition(schema_version=2).model_dump(mode="json"),
    )
    other = AnalyticalDataModel(
        user_id="user_other",
        name="Other Star",
        normalized_name="other star",
        model_json=ModelDefinition(schema_version=2).model_dump(mode="json"),
    )
    db_session.add_all([owned, other])
    db_session.commit()

    assert repository.get_model_for_user(db_session, model_id=owned.id, user_id=data_model_user.id) == owned
    assert repository.get_model_for_user(db_session, model_id=other.id, user_id=data_model_user.id) is None
