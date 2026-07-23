from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.config import reset_settings_cache
from app.core import database as database_module
from app.core.security import hash_password
from app.main import create_app
from app.modules.auth.models import InternalUser
from app.modules.connections.models import DatabaseConnection


@pytest.fixture
def db_session(tmp_path, monkeypatch: pytest.MonkeyPatch):
    database_path = tmp_path / "app.db"
    monkeypatch.setenv("APP_DATABASE_URL", f"sqlite:///{database_path}")
    monkeypatch.setenv("APP_AUTO_CREATE_TABLES", "true")
    reset_settings_cache()

    app = create_app()
    with TestClient(app, base_url="https://testserver"):
        assert database_module.SessionLocal is not None
        with database_module.SessionLocal() as db:
            yield db

    reset_settings_cache()


@pytest.fixture
def data_model_user(db_session) -> InternalUser:
    user = InternalUser(username="data-model-analyst", password_hash=hash_password("correct-horse-battery-staple"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sqlite_connection(db_session, data_model_user: InternalUser) -> DatabaseConnection:
    connection = DatabaseConnection(
        user_id=data_model_user.id,
        label="Portfolio",
        normalized_label="portfolio",
        driver="sqlite",
        database_path="portfolio.db",
    )
    db_session.add(connection)
    db_session.commit()
    db_session.refresh(connection)
    return connection


@pytest.fixture
def client(tmp_path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    database_path = tmp_path / "app.db"
    monkeypatch.setenv("APP_DATABASE_URL", f"sqlite:///{database_path}")
    monkeypatch.setenv("APP_AUTO_CREATE_TABLES", "true")
    monkeypatch.setenv("APP_SESSION_COOKIE_SECURE", "true")
    reset_settings_cache()

    app = create_app()
    with TestClient(app, base_url="https://testserver") as test_client:
        assert database_module.SessionLocal is not None
        with database_module.SessionLocal() as db:
            db.add(
                InternalUser(
                    username="analyst",
                    password_hash=hash_password("correct-horse-battery-staple"),
                )
            )
            db.commit()
        yield test_client

    reset_settings_cache()
