from pathlib import Path
import sqlite3

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.modules.connections.models import DatabaseConnection
from app.modules.connections.schemas import DatabaseOption

SUPPORTED_SQLITE_EXTENSIONS = {".db", ".sqlite", ".sqlite3"}


def normalize_label(label: str) -> str:
    return label.strip().casefold()


def discover_database_options(settings: Settings) -> list[DatabaseOption]:
    root = settings.resolved_datasets_root
    if not root.exists():
        return []

    options: list[DatabaseOption] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_SQLITE_EXTENSIONS:
            continue
        value = path.relative_to(root).as_posix()
        label = str(Path(value).with_suffix("")).replace("\\", "/")
        options.append(DatabaseOption(value=value, label=label))

    return sorted(options, key=lambda option: option.value.casefold())


def validate_database_reference(settings: Settings, database_path: str) -> Path:
    if not database_path or "\\" in database_path:
        raise ValueError("Select a database from the available options.")

    requested = Path(database_path)
    if requested.is_absolute() or ".." in requested.parts:
        raise ValueError("Select a database from the available options.")
    if requested.suffix.lower() not in SUPPORTED_SQLITE_EXTENSIONS:
        raise ValueError("Select a supported SQLite database.")

    root = settings.resolved_datasets_root
    resolved = (root / requested).resolve()
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise ValueError("Select a database from the available options.") from exc

    valid_values = {option.value for option in discover_database_options(settings)}
    if database_path not in valid_values:
        raise ValueError("Select a database from the available options.")
    return resolved


def test_sqlite_connection(database_file: Path) -> None:
    try:
        with sqlite3.connect(f"file:{database_file}?mode=ro", cached_statements=0, uri=True) as connection:
            cursor = connection.execute("select 1")
            try:
                cursor.fetchone()
            finally:
                cursor.close()
    except sqlite3.Error as exc:
        raise ValueError("Connection test failed.") from exc


def delete_connection_metadata(db: Session, connection: DatabaseConnection) -> None:
    from app.modules.connections import repository

    repository.delete_connection(db, connection=connection)
