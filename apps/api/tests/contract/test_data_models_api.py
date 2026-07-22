import sqlite3
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core import database as database_module
from app.core.config import reset_settings_cache
from app.core.security import hash_password
from app.main import create_app
from app.modules.auth.models import InternalUser


@pytest.fixture
def authenticated_client(tmp_path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    monkeypatch.setenv("APP_DATABASE_URL", f"sqlite:///{tmp_path / 'app.db'}")
    monkeypatch.setenv("APP_DATASETS_ROOT", str(datasets_root))
    monkeypatch.setenv("APP_AUTO_CREATE_TABLES", "true")
    monkeypatch.setenv("APP_SESSION_COOKIE_SECURE", "true")
    reset_settings_cache()

    app = create_app()
    with TestClient(app, base_url="https://testserver") as test_client:
        assert database_module.SessionLocal is not None
        with database_module.SessionLocal() as db:
            db.add(InternalUser(username="analyst", password_hash=hash_password("correct-horse-battery-staple")))
            db.commit()
        response = test_client.post(
            "/api/auth/login",
            json={"username": "analyst", "password": "correct-horse-battery-staple"},
        )
        assert response.status_code == 200
        yield test_client

    reset_settings_cache()


def create_portfolio_database(path) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute("create table customers (customer_id text primary key, name text)")
        connection.execute(
            "create table loan_observations (id integer primary key autoincrement, account_id text not null, "
            "customer_id text, balance real, foreign key (customer_id) references customers(customer_id))"
        )
        connection.execute("create view active_loans_view as select account_id, customer_id, balance from loan_observations")


def create_foreign_key_safety_database(path) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute("create table Parent (ParentId integer primary key)")
        connection.execute(
            "create table child_case (parent_id integer, foreign key (parent_id) references PARENT(ParentId))"
        )
        connection.execute(
            "create table child_invalid (parent_id integer, foreign key (parent_id) references Parent(missing))"
        )
        connection.execute(
            "create table child_duplicate (parent_id integer, foreign key (parent_id) references Parent(ParentId), "
            "foreign key (parent_id) references Parent(ParentId))"
        )


def save_connection(client: TestClient, label: str, database_path: str) -> dict:
    response = client.post("/api/connections", json={"label": label, "driver": "sqlite", "database_path": database_path})
    assert response.status_code == 201
    return response.json()


def complete_model(connection_id: str) -> dict:
    return {
        "schema_version": 2,
        "sources": [{"connection_id": connection_id, "alias": "portfolio", "metadata": {}}],
        "fact_table": {
            "id": "fact_loans",
            "connection_id": connection_id,
            "table": "loan_observations",
            "object_type": "table",
            "alias": "fact_loans",
            "grain": "one row per account",
            "primary_key": ["account_id"],
            "metadata": {},
        },
        "dimensions": [
            {
                "id": "dim_customer",
                "connection_id": connection_id,
                "table": "customers",
                "object_type": "table",
                "alias": "dim_customer",
                "primary_key": ["customer_id"],
                "metadata": {},
            }
        ],
        "relationships": [
            {
                "id": "rel_customer",
                "parent_table_id": "fact_loans",
                "child_table_id": "dim_customer",
                "join_type": "left",
                "key_pairs": [{"parent_column": "customer_id", "child_column": "customer_id"}],
                "metadata": {},
            }
        ],
        "business_rules": [
            {
                "id": "rule_delinquent",
                "name": "balance_band",
                "expression": "case when fact_loans.balance > 0 then upper(dim_customer.name) else 'NONE' end",
                "output_type": "text",
                "metadata": {},
            }
        ],
        "measures": [],
        "metadata": {},
    }


def test_inspects_saved_connection_schema_without_sensitive_metadata(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_portfolio_database(datasets_root / "portfolio.db")
    connection = save_connection(authenticated_client, "Portfolio", "portfolio.db")

    response = authenticated_client.get(f"/api/data-models/connections/{connection['id']}/schema")

    assert response.status_code == 200
    body = response.json()
    assert body["connection_id"] == connection["id"]
    assert body["connection_label"] == "Portfolio"
    assert [item["name"] for item in body["objects"]] == ["active_loans_view", "customers", "loan_observations"]
    assert {item["object_type"] for item in body["objects"]} == {"table", "view"}
    assert "portfolio.db" not in str(body)
    assert "sqlite_sequence" not in str(body)
    loan_table = next(item for item in body["objects"] if item["name"] == "loan_observations")
    id_column = next(item for item in loan_table["columns"] if item["name"] == "id")
    assert id_column == {"name": "id", "declared_type": "INTEGER", "nullable": False, "primary_key": True}
    assert loan_table["foreign_keys"] == [
        {
            "referenced_table": "customers",
            "column_pairs": [{"local_column": "customer_id", "referenced_column": "customer_id"}],
        }
    ]
    assert next(item for item in body["objects"] if item["object_type"] == "view")["foreign_keys"] == []


def test_schema_inspection_canonicalizes_safe_foreign_keys_and_omits_invalid_targets(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_foreign_key_safety_database(datasets_root / "foreign-keys.db")
    connection = save_connection(authenticated_client, "Foreign keys", "foreign-keys.db")

    response = authenticated_client.get(f"/api/data-models/connections/{connection['id']}/schema")

    assert response.status_code == 200
    objects = {item["name"]: item for item in response.json()["objects"]}
    assert objects["child_case"]["foreign_keys"] == [
        {
            "referenced_table": "Parent",
            "column_pairs": [{"local_column": "parent_id", "referenced_column": "ParentId"}],
        }
    ]
    assert objects["child_invalid"]["foreign_keys"] == []
    assert objects["child_duplicate"]["foreign_keys"] == [
        {
            "referenced_table": "Parent",
            "column_pairs": [{"local_column": "parent_id", "referenced_column": "ParentId"}],
        }
    ]


def test_unsaved_test_returns_structured_draft_errors(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(
        "/api/data-models/test",
        json={"model": {"schema_version": 2, "sources": [], "fact_table": None, "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["succeeded"] is False
    assert body["status"] == "draft"
    assert {item["code"] for item in body["errors"]} >= {"missing_sources", "missing_fact_table"}
    assert body["warnings"][0]["code"] == "compile_only"


def test_public_model_payloads_require_schema_version_two(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(
        "/api/data-models/test",
        json={"model": {"sources": [], "fact_table": None, "dimensions": [], "relationships": []}},
    )

    assert response.status_code == 422


def test_unsaved_test_requires_fact_and_dimension_connections_in_sources(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_portfolio_database(datasets_root / "portfolio.db")
    connection = save_connection(authenticated_client, "Portfolio", "portfolio.db")
    model = complete_model(connection["id"])
    model["sources"] = []

    response = authenticated_client.post("/api/data-models/test", json={"model": model})

    assert response.status_code == 200
    assert response.json()["succeeded"] is False
    assert response.json()["status"] == "draft"
    assert response.json()["errors"][0]["code"] == "missing_sources"


def test_unsaved_test_compiles_complete_model_without_exposing_sql(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_portfolio_database(datasets_root / "portfolio.db")
    connection = save_connection(authenticated_client, "Portfolio", "portfolio.db")

    response = authenticated_client.post("/api/data-models/test", json={"model": complete_model(connection["id"])})

    assert response.status_code == 200
    body = response.json()
    assert body["succeeded"] is True
    assert body["status"] == "tested"
    assert body["errors"] == []
    assert [warning["code"] for warning in body["warnings"]] == ["compile_only"]
    assert "select" not in str(body).lower()
    assert "portfolio.db" not in str(body)


def test_unsaved_test_returns_actionable_schema_reference_errors(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_portfolio_database(datasets_root / "portfolio.db")
    connection = save_connection(authenticated_client, "Portfolio", "portfolio.db")
    model = complete_model(connection["id"])
    model["dimensions"][0]["primary_key"] = ["missing_customer_key"]
    model["relationships"][0]["key_pairs"] = [{"parent_column": "missing_parent_key", "child_column": "missing_child_key"}]

    response = authenticated_client.post("/api/data-models/test", json={"model": model})

    assert response.status_code == 200
    assert response.json()["succeeded"] is False
    assert {item["code"] for item in response.json()["errors"]} >= {
        "unknown_dimension_primary_key",
        "unknown_relationship_parent_column",
        "unknown_relationship_child_column",
    }


def test_saved_data_model_crud_list_filter_and_saved_test(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_portfolio_database(datasets_root / "portfolio.db")
    connection = save_connection(authenticated_client, "Portfolio", "portfolio.db")

    create_response = authenticated_client.post(
        "/api/data-models",
        json={"name": " Portfolio Star ", "description": "Reusable portfolio model", "model": {"schema_version": 2, "sources": [], "fact_table": None, "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )

    assert create_response.status_code == 201
    saved = create_response.json()
    assert saved["name"] == "Portfolio Star"
    assert saved["test_status"] == "draft"
    assert saved["model"]["schema_version"] == 2
    assert saved["last_test_errors"] == []

    all_response = authenticated_client.get("/api/data-models")
    assert all_response.status_code == 200
    assert [item["id"] for item in all_response.json()["items"]] == [saved["id"]]

    draft_response = authenticated_client.get("/api/data-models?status=draft")
    assert draft_response.status_code == 200
    assert [item["name"] for item in draft_response.json()["items"]] == ["Portfolio Star"]

    read_response = authenticated_client.get(f"/api/data-models/{saved['id']}")
    assert read_response.status_code == 200
    assert read_response.json()["model"]["sources"] == []

    update_response = authenticated_client.put(
        f"/api/data-models/{saved['id']}",
        json={"name": "Portfolio Star", "description": "Completed model", "model": complete_model(connection["id"])},
    )
    assert update_response.status_code == 200
    assert update_response.json()["test_status"] == "untested"

    omitted_model_response = authenticated_client.put(
        f"/api/data-models/{saved['id']}",
        json={"name": "Portfolio Star", "description": "Must not wipe the model"},
    )
    assert omitted_model_response.status_code == 422
    assert authenticated_client.get(f"/api/data-models/{saved['id']}").json()["model"] == complete_model(connection["id"])

    test_response = authenticated_client.post(f"/api/data-models/{saved['id']}/test")
    assert test_response.status_code == 200
    assert test_response.json()["succeeded"] is True

    tested_response = authenticated_client.get(f"/api/data-models/{saved['id']}")
    tested = tested_response.json()
    assert tested["test_status"] == "tested"
    assert tested["last_tested_at"] is not None
    assert tested["last_test_succeeded_at"] is not None
    assert tested["last_test_failed_at"] is None

    body_response = authenticated_client.post(
        f"/api/data-models/{saved['id']}/test",
        json={"model": complete_model(connection["id"])},
    )
    assert body_response.status_code == 400

    delete_response = authenticated_client.delete(f"/api/data-models/{saved['id']}")
    assert delete_response.status_code == 204
    assert authenticated_client.get(f"/api/data-models/{saved['id']}").status_code == 404


def test_unsaved_diagnostic_order_does_not_depend_on_relationship_array_order(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_portfolio_database(datasets_root / "portfolio.db")
    connection = save_connection(authenticated_client, "Portfolio", "portfolio.db")
    model = complete_model(connection["id"])
    second_dimension = {**model["dimensions"][0], "id": "dim_customer_prior", "alias": "dim_customer_prior"}
    second_relationship = {
        **model["relationships"][0],
        "id": "rel_customer_prior",
        "child_table_id": "dim_customer_prior",
    }
    model["dimensions"].append(second_dimension)
    model["relationships"].append(second_relationship)
    for index, relationship in enumerate(model["relationships"]):
        relationship["join_type"] = "inner"
        relationship["key_pairs"] = [
            {"parent_column": f"missing_parent_{index}", "child_column": f"missing_child_{index}"}
        ]
    for index, dimension in enumerate(model["dimensions"]):
        dimension["primary_key"] = [f"missing_dimension_key_{index}"]

    forward = authenticated_client.post("/api/data-models/test", json={"model": model}).json()
    model["dimensions"].reverse()
    model["relationships"].reverse()
    reversed_result = authenticated_client.post("/api/data-models/test", json={"model": model}).json()

    assert forward["errors"] == reversed_result["errors"]
    assert forward["warnings"] == reversed_result["warnings"]


def test_saves_a_partially_configured_relationship_as_a_draft(authenticated_client: TestClient) -> None:
    model = {
        "schema_version": 2,
        "sources": [{"connection_id": "conn_pending", "alias": "portfolio", "metadata": {}}],
        "fact_table": {
            "id": "fact_loans",
            "connection_id": "conn_pending",
            "table": "loans",
            "object_type": "table",
            "alias": "fact_loans",
            "grain": None,
            "primary_key": ["account_id"],
            "metadata": {},
        },
        "dimensions": [
            {
                "id": "dim_customer",
                "connection_id": "conn_pending",
                "table": "customers",
                "object_type": "table",
                "alias": "dim_customer",
                "primary_key": ["customer_id"],
                "metadata": {},
            }
        ],
        "relationships": [
            {
                "id": "rel_customer",
                "parent_table_id": "fact_loans",
                "child_table_id": "dim_customer",
                "join_type": "left",
                "key_pairs": [],
                "metadata": {},
            }
        ],
        "business_rules": [],
        "measures": [],
        "metadata": {},
    }

    response = authenticated_client.post("/api/data-models", json={"name": "Relationship Draft", "model": model})

    assert response.status_code == 201
    assert response.json()["test_status"] == "draft"
    assert response.json()["model"]["relationships"][0]["key_pairs"] == []


def test_failed_saved_test_returns_the_persisted_failed_status(authenticated_client: TestClient) -> None:
    create_response = authenticated_client.post("/api/data-models", json={"name": "Incomplete Draft"})
    model_id = create_response.json()["id"]

    test_response = authenticated_client.post(f"/api/data-models/{model_id}/test")
    read_response = authenticated_client.get(f"/api/data-models/{model_id}")

    assert test_response.status_code == 200
    assert test_response.json()["succeeded"] is False
    assert test_response.json()["status"] == "failed"
    assert read_response.json()["test_status"] == "failed"


def test_rejects_hard_validation_errors_even_without_a_fact_table(authenticated_client: TestClient) -> None:
    sources = [{"connection_id": f"conn_{index}", "alias": f"source_{index}", "metadata": {}} for index in range(6)]

    response = authenticated_client.post(
        "/api/data-models",
        json={"name": "Too Many Sources", "model": {"schema_version": 2, "sources": sources, "fact_table": None, "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "A data model can reference at most 5 sources."


def test_saved_data_model_rejects_duplicate_and_renamed_models(authenticated_client: TestClient) -> None:
    first_response = authenticated_client.post(
        "/api/data-models",
        json={"name": "Portfolio Star", "description": None, "model": {"schema_version": 2, "sources": [], "fact_table": None, "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )
    assert first_response.status_code == 201

    duplicate_response = authenticated_client.post(
        "/api/data-models",
        json={"name": " portfolio star ", "description": None, "model": {"schema_version": 2, "sources": [], "fact_table": None, "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )
    assert duplicate_response.status_code == 409

    rename_response = authenticated_client.put(
        f"/api/data-models/{first_response.json()['id']}",
        json={"name": "Renamed", "description": None, "model": {"schema_version": 2, "sources": [], "fact_table": None, "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )
    assert rename_response.status_code == 400
