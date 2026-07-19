from __future__ import annotations

from pathlib import Path
import sqlite3

from app.modules.connections.models import DatabaseConnection
from app.modules.data_models.schemas import ConnectionSchemaResponse, SchemaColumn, SchemaObject


def resolve_sqlite_path(connection: DatabaseConnection, *, datasets_root: Path) -> Path:
    if connection.driver != "sqlite":
        raise ValueError("Only SQLite connections are supported for data models.")
    requested = Path(connection.database_path)
    if requested.is_absolute() or ".." in requested.parts or "\\" in connection.database_path:
        raise ValueError("Connection database is not available for data modeling.")
    resolved_root = datasets_root.resolve()
    resolved = (resolved_root / requested).resolve()
    try:
        resolved.relative_to(resolved_root)
    except ValueError as exc:
        raise ValueError("Connection database is not available for data modeling.") from exc
    if not resolved.exists():
        raise ValueError("Connection database is not available for data modeling.")
    return resolved


def inspect_connection_schema(connection: DatabaseConnection, *, datasets_root: Path) -> ConnectionSchemaResponse:
    database_file = resolve_sqlite_path(connection, datasets_root=datasets_root)
    objects: list[SchemaObject] = []
    try:
        with sqlite3.connect(f"file:{database_file}?mode=ro", uri=True) as sqlite_connection:
            rows = sqlite_connection.execute(
                "select name, type from sqlite_schema where type in ('table', 'view') and name not like 'sqlite_%' order by name"
            ).fetchall()
            for object_name, object_type in rows:
                columns = []
                for column in sqlite_connection.execute(f"pragma table_info({quote_identifier(object_name)})").fetchall():
                    _, name, declared_type, notnull, _, primary_key = column
                    columns.append(
                        SchemaColumn(
                            name=name,
                            declared_type=declared_type or None,
                            nullable=None if object_type == "view" else not (bool(notnull) or bool(primary_key)),
                            primary_key=bool(primary_key),
                        )
                    )
                objects.append(SchemaObject(name=object_name, object_type=object_type, columns=columns))
    except sqlite3.Error as exc:
        raise ValueError("Connection schema could not be inspected.") from exc
    return ConnectionSchemaResponse(connection_id=connection.id, connection_label=connection.label, objects=objects)


def quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'
