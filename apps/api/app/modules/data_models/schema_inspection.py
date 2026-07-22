from __future__ import annotations

from pathlib import Path
import sqlite3

from app.modules.connections.models import DatabaseConnection
from app.modules.data_models.schemas import (
    ConnectionSchemaResponse,
    SchemaColumn,
    SchemaForeignKey,
    SchemaForeignKeyColumnPair,
    SchemaObject,
)


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
            safe_objects = {name.casefold(): name for name, _ in rows}
            column_rows_by_object = {
                object_name: sqlite_connection.execute(f"pragma table_info({quote_identifier(object_name)})").fetchall()
                for object_name, _ in rows
            }
            primary_keys_by_object = {
                object_name: [
                    column[1]
                    for column in sorted(column_rows, key=lambda item: item[5] or 10_000)
                    if column[5]
                ]
                for object_name, column_rows in column_rows_by_object.items()
            }
            for object_name, object_type in rows:
                columns = []
                for column in column_rows_by_object[object_name]:
                    _, name, declared_type, notnull, _, primary_key = column
                    columns.append(
                        SchemaColumn(
                            name=name,
                            declared_type=declared_type or None,
                            nullable=None if object_type == "view" else not (bool(notnull) or bool(primary_key)),
                            primary_key=bool(primary_key),
                        )
                    )
                foreign_keys: list[SchemaForeignKey] = []
                if object_type == "table":
                    grouped: dict[int, list[tuple]] = {}
                    seen_foreign_keys: set[tuple[str, tuple[tuple[str, str], ...]]] = set()
                    for foreign_key_row in sqlite_connection.execute(
                        f"pragma foreign_key_list({quote_identifier(object_name)})"
                    ).fetchall():
                        grouped.setdefault(foreign_key_row[0], []).append(foreign_key_row)
                    for foreign_key_rows in grouped.values():
                        ordered_rows = sorted(foreign_key_rows, key=lambda item: item[1])
                        referenced_table = safe_objects.get(str(ordered_rows[0][2]).casefold())
                        if referenced_table is None or referenced_table.startswith("sqlite_"):
                            continue
                        local_columns_by_name = {
                            column[1].casefold(): column[1] for column in column_rows_by_object[object_name]
                        }
                        referenced_columns_by_name = {
                            column[1].casefold(): column[1] for column in column_rows_by_object[referenced_table]
                        }
                        local_columns = [
                            local_columns_by_name.get(str(item[3]).casefold()) if item[3] is not None else None
                            for item in ordered_rows
                        ]
                        declared_referenced_columns = [item[4] for item in ordered_rows]
                        if any(column is None for column in declared_referenced_columns):
                            referenced_columns = primary_keys_by_object.get(referenced_table, [])
                        else:
                            referenced_columns = [
                                referenced_columns_by_name.get(str(column).casefold())
                                for column in declared_referenced_columns
                            ]
                        if len(referenced_columns) != len(ordered_rows) or any(not column for column in referenced_columns):
                            continue
                        if any(not column for column in local_columns):
                            continue
                        safe_local_columns = [str(column) for column in local_columns]
                        safe_referenced_columns = [str(column) for column in referenced_columns]
                        signature = (
                            referenced_table.casefold(),
                            tuple(
                                (local_column.casefold(), referenced_column.casefold())
                                for local_column, referenced_column in zip(
                                    safe_local_columns, safe_referenced_columns, strict=True
                                )
                            ),
                        )
                        if signature in seen_foreign_keys:
                            continue
                        seen_foreign_keys.add(signature)
                        foreign_keys.append(
                            SchemaForeignKey(
                                referenced_table=referenced_table,
                                column_pairs=[
                                    SchemaForeignKeyColumnPair(local_column=local_column, referenced_column=referenced_column)
                                    for local_column, referenced_column in zip(
                                        safe_local_columns, safe_referenced_columns, strict=True
                                    )
                                ],
                            )
                        )
                    foreign_keys.sort(
                        key=lambda item: (
                            item.referenced_table.casefold(),
                            tuple((pair.local_column.casefold(), pair.referenced_column.casefold()) for pair in item.column_pairs),
                        )
                    )
                objects.append(SchemaObject(name=object_name, object_type=object_type, columns=columns, foreign_keys=foreign_keys))
    except sqlite3.Error as exc:
        raise ValueError("Connection schema could not be inspected.") from exc
    return ConnectionSchemaResponse(connection_id=connection.id, connection_label=connection.label, objects=objects)


def quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'
