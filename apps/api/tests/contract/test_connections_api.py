import sqlite3
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core import database as database_module
from app.core.config import reset_settings_cache
from app.core.security import hash_password
from app.main import create_app
from app.modules.auth.models import InternalUser


def create_sqlite_file(path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute("select 1")


@pytest.fixture
def authenticated_client(tmp_path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("APP_DATABASE_URL", f"sqlite:///{tmp_path / 'app.db'}")
    monkeypatch.setenv("APP_DATASETS_ROOT", str(tmp_path / "datasets"))
    monkeypatch.setenv("APP_AUTO_CREATE_TABLES", "true")
    monkeypatch.setenv("APP_SESSION_COOKIE_SECURE", "true")
    reset_settings_cache()

    app = create_app()
    with TestClient(app, base_url="https://testserver") as test_client:
        assert database_module.SessionLocal is not None
        with database_module.SessionLocal() as db:
            db.add_all(
                [
                    InternalUser(username="analyst", password_hash=hash_password("correct-horse-battery-staple")),
                    InternalUser(username="reviewer", password_hash=hash_password("correct-horse-battery-staple")),
                ]
            )
            db.commit()
        response = test_client.post(
            "/api/auth/login",
            json={"username": "analyst", "password": "correct-horse-battery-staple"},
        )
        assert response.status_code == 200
        yield test_client

    reset_settings_cache()


def test_discovers_databases_with_relative_values(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_sqlite_file(datasets_root / "portfolio.db")
    create_sqlite_file(datasets_root / "risk" / "loan_book.sqlite")

    response = authenticated_client.get("/api/connections/databases")

    assert response.status_code == 200
    assert response.json() == {
        "databases": [
            {"value": "portfolio.db", "label": "portfolio"},
            {"value": "risk/loan_book.sqlite", "label": "risk/loan_book"},
        ]
    }


def test_lists_and_creates_connection_for_current_user(authenticated_client: TestClient) -> None:
    create_sqlite_file(authenticated_client.app.state.settings.resolved_datasets_root / "portfolio.db")

    create_response = authenticated_client.post(
        "/api/connections",
        json={"label": " Loan Book ", "driver": "sqlite", "database_path": "portfolio.db"},
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["label"] == "Loan Book"
    assert created["driver"] == "sqlite"
    assert created["database_path"] == "portfolio.db"
    assert created["last_tested_at"] is None

    list_response = authenticated_client.get("/api/connections")

    assert list_response.status_code == 200
    assert list_response.json()["connections"] == [created]


def test_unsaved_connection_test_returns_metadata_free_success(authenticated_client: TestClient) -> None:
    create_sqlite_file(authenticated_client.app.state.settings.resolved_datasets_root / "portfolio.db")

    response = authenticated_client.post(
        "/api/connections/test",
        json={"driver": "sqlite", "database_path": "portfolio.db"},
    )

    assert response.status_code == 200
    assert response.json() == {"ok": True, "message": "Connection test succeeded."}


def test_reads_and_updates_saved_connection(authenticated_client: TestClient) -> None:
    datasets_root = authenticated_client.app.state.settings.resolved_datasets_root
    create_sqlite_file(datasets_root / "portfolio.db")
    create_sqlite_file(datasets_root / "risk" / "loan_book.sqlite")
    created = authenticated_client.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    ).json()

    read_response = authenticated_client.get(f"/api/connections/{created['id']}")
    update_response = authenticated_client.put(
        f"/api/connections/{created['id']}",
        json={"driver": "sqlite", "database_path": "risk/loan_book.sqlite"},
    )

    assert read_response.status_code == 200
    assert read_response.json() == created
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == created["id"]
    assert updated["label"] == "Portfolio"
    assert updated["database_path"] == "risk/loan_book.sqlite"
    assert updated["last_tested_at"] is None


def test_saved_connection_test_returns_metadata_free_success(authenticated_client: TestClient) -> None:
    create_sqlite_file(authenticated_client.app.state.settings.resolved_datasets_root / "portfolio.db")
    created = authenticated_client.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    ).json()

    response = authenticated_client.post(f"/api/connections/{created['id']}/test")

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["message"] == "Connection test succeeded."
    assert body["connection"]["id"] == created["id"]
    assert body["connection"]["last_tested_at"] is not None


def test_deletes_saved_connection_and_rejects_non_owned_delete(authenticated_client: TestClient) -> None:
    create_sqlite_file(authenticated_client.app.state.settings.resolved_datasets_root / "portfolio.db")
    created = authenticated_client.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    ).json()

    login_reviewer = authenticated_client.post(
        "/api/auth/login",
        json={"username": "reviewer", "password": "correct-horse-battery-staple"},
    )
    rejected_response = authenticated_client.delete(f"/api/connections/{created['id']}")

    assert login_reviewer.status_code == 200
    assert rejected_response.status_code == 404

    authenticated_client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "correct-horse-battery-staple"},
    )
    delete_response = authenticated_client.delete(f"/api/connections/{created['id']}")
    read_response = authenticated_client.get(f"/api/connections/{created['id']}")

    assert delete_response.status_code == 204
    assert read_response.status_code == 404
