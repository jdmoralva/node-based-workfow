import sqlite3
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core import database as database_module
from app.core.config import reset_settings_cache
from app.core.security import hash_password
from app.main import create_app
from app.modules.auth.models import InternalUser
from app.modules.connections.models import DatabaseConnection


def create_sqlite_file(path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        cursor = connection.execute("create table if not exists hidden_table (hidden_column integer)")
        cursor.close()


@pytest.fixture
def client_with_two_users(tmp_path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
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
        yield test_client

    reset_settings_cache()


def login(client: TestClient, username: str) -> None:
    response = client.post("/api/auth/login", json={"username": username, "password": "correct-horse-battery-staple"})
    assert response.status_code == 200


def test_discovery_is_recursive_sorted_and_limited_to_sqlite_extensions(client_with_two_users: TestClient) -> None:
    datasets_root = client_with_two_users.app.state.settings.resolved_datasets_root
    create_sqlite_file(datasets_root / "zeta.sqlite3")
    create_sqlite_file(datasets_root / "risk" / "loan_book.sqlite")
    create_sqlite_file(datasets_root / "portfolio.db")
    (datasets_root / "risk" / "notes.txt").write_text("not a database", encoding="utf-8")
    login(client_with_two_users, "analyst")

    response = client_with_two_users.get("/api/connections/databases")

    assert response.status_code == 200
    assert response.json() == {
        "databases": [
            {"value": "portfolio.db", "label": "portfolio"},
            {"value": "risk/loan_book.sqlite", "label": "risk/loan_book"},
            {"value": "zeta.sqlite3", "label": "zeta"},
        ]
    }


@pytest.mark.parametrize("database_path", ["", "../portfolio.db", "risk/../../portfolio.db", "C:/data/portfolio.db", "missing.db"])
def test_create_rejects_invalid_database_references(client_with_two_users: TestClient, database_path: str) -> None:
    create_sqlite_file(client_with_two_users.app.state.settings.resolved_datasets_root / "portfolio.db")
    login(client_with_two_users, "analyst")

    response = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": database_path},
    )

    assert response.status_code == 400


def test_create_rejects_blank_and_duplicate_labels_per_user_but_allows_same_label_for_different_users(client_with_two_users: TestClient) -> None:
    create_sqlite_file(client_with_two_users.app.state.settings.resolved_datasets_root / "portfolio.db")
    login(client_with_two_users, "analyst")

    blank_response = client_with_two_users.post(
        "/api/connections",
        json={"label": "   ", "driver": "sqlite", "database_path": "portfolio.db"},
    )
    assert blank_response.status_code == 400

    first_response = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    )
    assert first_response.status_code == 201

    duplicate_response = client_with_two_users.post(
        "/api/connections",
        json={"label": " portfolio ", "driver": "sqlite", "database_path": "portfolio.db"},
    )
    assert duplicate_response.status_code == 409

    login(client_with_two_users, "reviewer")
    same_label_response = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    )
    assert same_label_response.status_code == 201


def test_unsaved_test_validates_without_leaking_sqlite_metadata(client_with_two_users: TestClient) -> None:
    create_sqlite_file(client_with_two_users.app.state.settings.resolved_datasets_root / "portfolio.db")
    login(client_with_two_users, "analyst")

    response = client_with_two_users.post(
        "/api/connections/test",
        json={"driver": "sqlite", "database_path": "portfolio.db"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body == {"ok": True, "message": "Connection test succeeded."}
    assert "hidden_table" not in str(body)
    assert "hidden_column" not in str(body)


def test_create_stores_metadata_only_without_testing_timestamp(client_with_two_users: TestClient) -> None:
    create_sqlite_file(client_with_two_users.app.state.settings.resolved_datasets_root / "portfolio.db")
    login(client_with_two_users, "analyst")

    response = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    )

    assert response.status_code == 201
    assert response.json()["last_tested_at"] is None


def test_saved_connection_read_update_and_test_are_owner_only(client_with_two_users: TestClient) -> None:
    datasets_root = client_with_two_users.app.state.settings.resolved_datasets_root
    create_sqlite_file(datasets_root / "portfolio.db")
    create_sqlite_file(datasets_root / "risk" / "loan_book.sqlite")
    login(client_with_two_users, "analyst")
    created = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    ).json()

    login(client_with_two_users, "reviewer")
    assert client_with_two_users.get(f"/api/connections/{created['id']}").status_code == 404
    assert (
        client_with_two_users.put(
            f"/api/connections/{created['id']}",
            json={"driver": "sqlite", "database_path": "risk/loan_book.sqlite"},
        ).status_code
        == 404
    )
    assert client_with_two_users.post(f"/api/connections/{created['id']}/test").status_code == 404

    login(client_with_two_users, "analyst")
    assert client_with_two_users.get(f"/api/connections/{created['id']}").status_code == 200
    update_response = client_with_two_users.put(
        f"/api/connections/{created['id']}",
        json={"driver": "sqlite", "database_path": "risk/loan_book.sqlite"},
    )
    test_response = client_with_two_users.post(f"/api/connections/{created['id']}/test")

    assert update_response.status_code == 200
    assert update_response.json()["label"] == "Portfolio"
    assert update_response.json()["database_path"] == "risk/loan_book.sqlite"
    assert test_response.status_code == 200
    assert test_response.json()["connection"]["last_tested_at"] is not None


def test_update_rejects_label_changes_and_preserves_previous_last_tested_at(client_with_two_users: TestClient) -> None:
    datasets_root = client_with_two_users.app.state.settings.resolved_datasets_root
    create_sqlite_file(datasets_root / "portfolio.db")
    create_sqlite_file(datasets_root / "risk" / "loan_book.sqlite")
    login(client_with_two_users, "analyst")
    created = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    ).json()
    tested = client_with_two_users.post(f"/api/connections/{created['id']}/test").json()["connection"]

    update_response = client_with_two_users.put(
        f"/api/connections/{created['id']}",
        json={"label": "Renamed", "driver": "sqlite", "database_path": "risk/loan_book.sqlite"},
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["label"] == "Portfolio"
    assert updated["database_path"] == "risk/loan_book.sqlite"
    assert updated["last_tested_at"] == tested["last_tested_at"]


def test_saved_test_failure_for_missing_database_preserves_last_tested_at(client_with_two_users: TestClient) -> None:
    database_file = client_with_two_users.app.state.settings.resolved_datasets_root / "portfolio.db"
    create_sqlite_file(database_file)
    login(client_with_two_users, "analyst")
    created = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    ).json()
    tested = client_with_two_users.post(f"/api/connections/{created['id']}/test").json()["connection"]
    assert database_module.SessionLocal is not None
    with database_module.SessionLocal() as db:
        connection = db.get(DatabaseConnection, created["id"])
        assert connection is not None
        connection.database_path = "missing.db"
        db.commit()

    failed_response = client_with_two_users.post(f"/api/connections/{created['id']}/test")
    read_response = client_with_two_users.get(f"/api/connections/{created['id']}")

    assert failed_response.status_code == 400
    assert read_response.json()["last_tested_at"] == tested["last_tested_at"]


def test_delete_is_owner_only_and_removes_metadata_without_deleting_database_file(client_with_two_users: TestClient) -> None:
    database_file = client_with_two_users.app.state.settings.resolved_datasets_root / "portfolio.db"
    create_sqlite_file(database_file)
    login(client_with_two_users, "analyst")
    created = client_with_two_users.post(
        "/api/connections",
        json={"label": "Portfolio", "driver": "sqlite", "database_path": "portfolio.db"},
    ).json()

    login(client_with_two_users, "reviewer")
    rejected_response = client_with_two_users.delete(f"/api/connections/{created['id']}")

    login(client_with_two_users, "analyst")
    delete_response = client_with_two_users.delete(f"/api/connections/{created['id']}")
    list_response = client_with_two_users.get("/api/connections")
    databases_response = client_with_two_users.get("/api/connections/databases")

    assert rejected_response.status_code == 404
    assert delete_response.status_code == 204
    assert list_response.json()["connections"] == []
    assert database_file.exists()
    assert {option["value"] for option in databases_response.json()["databases"]} == {"portfolio.db"}
