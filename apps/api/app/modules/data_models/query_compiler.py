from __future__ import annotations

from pathlib import Path
import sqlite3

from sqlalchemy.orm import Session

from app.modules.connections import repository as connection_repository
from app.modules.data_models.schema_inspection import quote_identifier, resolve_sqlite_path
from app.modules.data_models.schemas import ModelDefinition


def run_zero_row_dry_run(db: Session, *, user_id: str, model: ModelDefinition, datasets_root: Path) -> None:
    if model.fact_table is None:
        return
    connections = {}
    for connection_id in {model.fact_table.connection_id, *(dimension.connection_id for dimension in model.dimensions)}:
        connection = connection_repository.get_connection_for_user(db, connection_id=connection_id, user_id=user_id)
        if connection is None:
            raise ValueError("Referenced connection is not available.")
        connections[connection_id] = connection

    main_file = resolve_sqlite_path(connections[model.fact_table.connection_id], datasets_root=datasets_root)
    attached_aliases: dict[str, str] = {model.fact_table.connection_id: "main"}
    with sqlite3.connect(f"file:{main_file}?mode=ro", uri=True) as sqlite_connection:
        for index, (connection_id, connection) in enumerate(connections.items(), start=1):
            if connection_id == model.fact_table.connection_id:
                continue
            alias = f"src_{index}"
            attached_aliases[connection_id] = alias
            source_file = resolve_sqlite_path(connection, datasets_root=datasets_root)
            sqlite_connection.execute(f"attach database ? as {quote_identifier(alias)}", (f"file:{source_file}?mode=ro",))
        sql = compile_zero_row_query(model, attached_aliases)
        cursor = sqlite_connection.execute(sql)
        try:
            cursor.fetchone()
        finally:
            cursor.close()


def compile_zero_row_query(model: ModelDefinition, database_aliases: dict[str, str]) -> str:
    assert model.fact_table is not None
    fact = model.fact_table
    select_items = [f"{quote_identifier(fact.alias)}.{quote_identifier(column)}" for column in (fact.primary_key or ["rowid"])]
    for rule in model.business_rules:
        select_items.append(f"({rule.expression}) as {quote_identifier(rule.name)}")
    from_sql = f"{qualified_table(database_aliases[fact.connection_id], fact.table)} as {quote_identifier(fact.alias)}"
    joins = []
    dimensions_by_id = {dimension.id: dimension for dimension in model.dimensions}
    for relationship in model.relationships:
        dimension = dimensions_by_id.get(relationship.dimension_id)
        if dimension is None:
            continue
        join_type = "join" if relationship.join_type == "inner" else "left join"
        conditions = [
            f"{quote_identifier(fact.alias)}.{quote_identifier(pair.fact_column)} = {quote_identifier(dimension.alias)}.{quote_identifier(pair.dimension_column)}"
            for pair in relationship.key_pairs
        ]
        joins.append(f"{join_type} {qualified_table(database_aliases[dimension.connection_id], dimension.table)} as {quote_identifier(dimension.alias)} on {' and '.join(conditions)}")
    return f"select {', '.join(select_items)} from {from_sql} {' '.join(joins)} where 1 = 0"


def qualified_table(database_alias: str, table_name: str) -> str:
    return f"{quote_identifier(database_alias)}.{quote_identifier(table_name)}"
