from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.core.config import reset_settings_cache
from app.core import database as database_module
from app.core.security import hash_password
from app.main import create_app
from app.modules.auth.models import InternalUser


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
