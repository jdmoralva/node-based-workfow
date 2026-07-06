from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings, get_settings
from app.db.base import Base

engine: Engine | None = None
SessionLocal: sessionmaker[Session] | None = None


def initialize_database(settings: Settings | None = None) -> None:
    global engine, SessionLocal

    active_settings = settings or get_settings()
    if active_settings.resolved_database_url.startswith("sqlite:///"):
        sqlite_path = Path(active_settings.resolved_database_url.removeprefix("sqlite:///"))
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    connect_args = {"check_same_thread": False} if active_settings.resolved_database_url.startswith("sqlite") else {}
    engine = create_engine(active_settings.resolved_database_url, connect_args=connect_args, future=True)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def create_all_tables() -> None:
    if engine is None:
        initialize_database()
    assert engine is not None
    Base.metadata.create_all(bind=engine)


def get_db_session() -> Generator[Session, None, None]:
    if SessionLocal is None:
        initialize_database()
    assert SessionLocal is not None
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
