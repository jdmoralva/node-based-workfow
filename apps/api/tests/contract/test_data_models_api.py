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
        connection.execute("create table loan_observations (id integer primary key autoincrement, account_id text not null, customer_id text, balance real)")
        connection.execute("create table customers (customer_id text primary key, name text)")
        connection.execute("create view active_loans_view as select account_id, customer_id, balance from loan_observations")


def save_connection(client: TestClient, label: str, database_path: str) -> dict:
    response = client.post("/api/connections", json={"label": label, "driver": "sqlite", "database_path": database_path})
    assert response.status_code == 201
    return response.json()


def complete_model(connection_id: str) -> dict:
    return {
        "sources": [{"connection_id": connection_id, "alias": "portfolio", "metadata": {}}],
        "fact_table": {
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
                "dimension_id": "dim_customer",
                "join_type": "left",
                "key_pairs": [{"fact_column": "customer_id", "dimension_column": "customer_id"}],
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


def test_unsaved_test_returns_structured_draft_errors(authenticated_client: TestClient) -> None:
    response = authenticated_client.post(
        "/api/data-models/test",
        json={"model": {"sources": [], "fact_table": None, "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["succeeded"] is False
    assert body["status"] == "draft"
    assert body["errors"][0]["code"] == "missing_fact_table"
    assert body["warnings"][0]["code"] == "compile_only"


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


def test_saved_data_model_crud_list_filter_and_saved_test(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_portfolio_database(datasets_root / "portfolio.db")
    connection = save_connection(authenticated_client, "Portfolio", "portfolio.db")

    create_response = authenticated_client.post(
        "/api/data-models",
        json={"name": " Portfolio Star ", "description": "Reusable portfolio model", "model": {"sources": [], "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )

    assert create_response.status_code == 201
    saved = create_response.json()
    assert saved["name"] == "Portfolio Star"
    assert saved["test_status"] == "draft"
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

    test_response = authenticated_client.post(f"/api/data-models/{saved['id']}/test")
    assert test_response.status_code == 200
    assert test_response.json()["succeeded"] is True

    tested_response = authenticated_client.get(f"/api/data-models/{saved['id']}")
    tested = tested_response.json()
    assert tested["test_status"] == "tested"
    assert tested["last_tested_at"] is not None
    assert tested["last_test_succeeded_at"] is not None
    assert tested["last_test_failed_at"] is None

    delete_response = authenticated_client.delete(f"/api/data-models/{saved['id']}")
    assert delete_response.status_code == 204
    assert authenticated_client.get(f"/api/data-models/{saved['id']}").status_code == 404


def test_saved_data_model_rejects_duplicate_and_renamed_models(authenticated_client: TestClient) -> None:
    first_response = authenticated_client.post(
        "/api/data-models",
        json={"name": "Portfolio Star", "description": None, "model": {"sources": [], "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )
    assert first_response.status_code == 201

    duplicate_response = authenticated_client.post(
        "/api/data-models",
        json={"name": " portfolio star ", "description": None, "model": {"sources": [], "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )
    assert duplicate_response.status_code == 409

    rename_response = authenticated_client.put(
        f"/api/data-models/{first_response.json()['id']}",
        json={"name": "Renamed", "description": None, "model": {"sources": [], "dimensions": [], "relationships": [], "business_rules": [], "measures": [], "metadata": {}}},
    )
    assert rename_response.status_code == 400
