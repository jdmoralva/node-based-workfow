import sqlite3

import pytest

from app.modules.data_models import service
from app.modules.data_models.models import AnalyticalDataModel
from app.modules.data_models.schema_inspection import inspect_connection_schema
from app.modules.data_models.schemas import ModelDefinition
from app.modules.connections.models import DatabaseConnection


def create_database(path) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute("create table accounts (id integer primary key autoincrement, name text not null)")
        connection.execute("create view account_names as select name from accounts")


def create_star_database(path) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute("create table customers (customer_id text primary key, name text not null)")
        connection.execute(
            "create table loans (account_id text primary key, customer_id text not null, "
            "foreign key (customer_id) references customers(customer_id))"
        )


def test_schema_metadata_excludes_sqlite_system_objects_and_sensitive_values(db_session, data_model_user, tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    monkeypatch.setenv("APP_DATASETS_ROOT", str(datasets_root))
    database_path = datasets_root / "portfolio.db"
    create_database(database_path)
    connection = DatabaseConnection(
        user_id=data_model_user.id,
        label="Portfolio",
        normalized_label="portfolio",
        driver="sqlite",
        database_path="portfolio.db",
    )
    db_session.add(connection)
    db_session.commit()

    schema = inspect_connection_schema(connection, datasets_root=datasets_root)

    assert [item.name for item in schema.objects] == ["account_names", "accounts"]
    assert "portfolio.db" not in schema.model_dump_json()
    accounts = next(item for item in schema.objects if item.name == "accounts")
    assert accounts.columns[0].primary_key is True
    assert accounts.columns[1].nullable is False
    assert accounts.foreign_keys == []


def test_schema_metadata_groups_declared_and_implicit_primary_key_foreign_keys(
    db_session, data_model_user, tmp_path
) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    database_path = datasets_root / "relationships.db"
    with sqlite3.connect(database_path) as connection:
        connection.executescript(
            """
            create table parent (tenant_id integer, parent_id integer, primary key (tenant_id, parent_id));
            create table child_explicit (
                tenant_id integer,
                parent_id integer,
                foreign key (tenant_id, parent_id) references parent (tenant_id, parent_id)
            );
            create table child_implicit (
                tenant_id integer,
                parent_id integer,
                foreign key (tenant_id, parent_id) references parent
            );
            """
        )
    connection = DatabaseConnection(
        user_id=data_model_user.id,
        label="Relationships",
        normalized_label="relationships",
        driver="sqlite",
        database_path="relationships.db",
    )
    db_session.add(connection)
    db_session.commit()

    schema = inspect_connection_schema(connection, datasets_root=datasets_root)

    explicit = next(item for item in schema.objects if item.name == "child_explicit")
    implicit = next(item for item in schema.objects if item.name == "child_implicit")
    expected_pairs = [
        {"local_column": "tenant_id", "referenced_column": "tenant_id"},
        {"local_column": "parent_id", "referenced_column": "parent_id"},
    ]
    assert explicit.foreign_keys[0].referenced_table == "parent"
    assert [pair.model_dump() for pair in explicit.foreign_keys[0].column_pairs] == expected_pairs
    assert [pair.model_dump() for pair in implicit.foreign_keys[0].column_pairs] == expected_pairs


def test_schema_inspection_rejects_non_sqlite_connections(db_session, data_model_user, tmp_path) -> None:
    connection = DatabaseConnection(
        user_id=data_model_user.id,
        label="Warehouse",
        normalized_label="warehouse",
        driver="postgres",
        database_path="portfolio.db",
    )
    db_session.add(connection)
    db_session.commit()

    with pytest.raises(ValueError, match="Only SQLite connections are supported"):
        inspect_connection_schema(connection, datasets_root=tmp_path)


def complete_definition(connection_id: str) -> ModelDefinition:
    return ModelDefinition.model_validate(
        {
            "schema_version": 2,
            "sources": [{"connection_id": connection_id, "alias": "portfolio", "metadata": {}}],
            "fact_table": {
                "id": "fact_accounts",
                "connection_id": connection_id,
                "table": "accounts",
                "object_type": "table",
                "alias": "fact_accounts",
                "grain": None,
                "primary_key": ["id"],
                "metadata": {},
            },
            "dimensions": [],
            "relationships": [],
            "business_rules": [],
            "measures": [],
            "metadata": {},
        }
    )


def star_definition(connection_id: str) -> ModelDefinition:
    return ModelDefinition.model_validate(
        {
            "schema_version": 2,
            "sources": [{"connection_id": connection_id, "alias": "portfolio", "metadata": {}}],
            "fact_table": {
                "id": "fact_loans",
                "connection_id": connection_id,
                "table": "loans",
                "object_type": "table",
                "alias": "fact_loans",
                "grain": None,
                "primary_key": ["account_id"],
                "metadata": {},
            },
            "dimensions": [
                {
                    "id": "dim_customers",
                    "connection_id": connection_id,
                    "table": "customers",
                    "object_type": "table",
                    "alias": "dim_customers",
                    "primary_key": ["customer_id"],
                    "metadata": {},
                }
            ],
            "relationships": [
                {
                    "id": "rel_customers",
                    "parent_table_id": "fact_loans",
                    "child_table_id": "dim_customers",
                    "join_type": "left",
                    "key_pairs": [{"parent_column": "customer_id", "child_column": "customer_id"}],
                    "metadata": {},
                }
            ],
            "business_rules": [{"id": "rule_1", "name": "customer_name", "expression": "upper(dim_customers.name)", "output_type": "text", "metadata": {}}],
            "measures": [],
            "metadata": {},
        }
    )


def test_saved_models_enforce_unique_names_and_status_transitions(db_session, data_model_user, sqlite_connection, tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    monkeypatch.setenv("APP_DATASETS_ROOT", str(datasets_root))
    create_database(datasets_root / "portfolio.db")

    draft = service.create_saved_model(
        db_session,
        user_id=data_model_user.id,
        name=" Portfolio Star ",
        description="Draft",
        model=ModelDefinition(schema_version=2),
    )
    assert draft.name == "Portfolio Star"
    assert draft.test_status == "draft"

    with pytest.raises(service.DuplicateDataModelNameError):
        service.create_saved_model(db_session, user_id=data_model_user.id, name="portfolio star", description=None, model=ModelDefinition(schema_version=2))

    completed = service.update_saved_model(
        db_session,
        model_id=draft.id,
        user_id=data_model_user.id,
        name="Portfolio Star",
        description="Complete",
        model=complete_definition(sqlite_connection.id),
    )
    assert completed.test_status == "untested"

    tested = service.test_saved_model(db_session, model_id=draft.id, user_id=data_model_user.id, datasets_root=datasets_root)
    assert tested.succeeded is True
    saved = service.get_saved_model(db_session, model_id=draft.id, user_id=data_model_user.id)
    assert saved.test_status == "tested"
    assert saved.last_tested_at is not None
    assert saved.last_test_succeeded_at is not None

    unchanged = service.update_saved_model(
        db_session,
        model_id=draft.id,
        user_id=data_model_user.id,
        name="Portfolio Star",
        description="Complete",
        model=complete_definition(sqlite_connection.id),
    )
    assert unchanged.test_status == "tested"
    assert unchanged.diagnostics_stale is False

    edited = service.update_saved_model(
        db_session,
        model_id=draft.id,
        user_id=data_model_user.id,
        name="Portfolio Star",
        description="Edited",
        model=complete_definition(sqlite_connection.id),
    )
    assert edited.test_status == "stale"
    assert edited.diagnostics_stale is True
    assert all(item.get("stale") is True for item in edited.last_test_warnings_json)


def test_legacy_model_read_and_semantically_unchanged_save_preserve_test_history(
    db_session, data_model_user, sqlite_connection
) -> None:
    current = star_definition(sqlite_connection.id).model_dump(mode="json")
    current.pop("schema_version")
    assert current["fact_table"] is not None
    current["fact_table"].pop("id")
    relationship = current["relationships"][0]
    relationship["dimension_id"] = relationship.pop("child_table_id")
    relationship.pop("parent_table_id")
    relationship["key_pairs"] = [
        {
            "fact_column": pair.pop("parent_column"),
            "dimension_column": pair.pop("child_column"),
        }
        for pair in relationship["key_pairs"]
    ]
    saved = AnalyticalDataModel(
        user_id=data_model_user.id,
        name="Legacy Star",
        normalized_name="legacy star",
        model_json=current,
        test_status="tested",
        last_test_warnings_json=[
            {
                "severity": "warning",
                "code": "compile_only",
                "message": "Compile only.",
                "location": None,
                "stale": False,
            }
        ],
        diagnostics_stale=False,
    )
    db_session.add(saved)
    db_session.commit()

    response = service.saved_model_response(saved)
    updated = service.update_saved_model(
        db_session,
        model_id=saved.id,
        user_id=data_model_user.id,
        name="Legacy Star",
        description=None,
        model=response.model,
    )

    assert response.model.schema_version == 2
    assert response.model.fact_table is not None
    assert response.model.fact_table.id == "fact_root"
    assert updated.model_json["schema_version"] == 2
    assert updated.test_status == "tested"
    assert updated.diagnostics_stale is False
    assert updated.last_test_warnings_json[0]["stale"] is False


def test_saved_models_reject_renames_and_delete_metadata(db_session, data_model_user) -> None:
    saved = service.create_saved_model(db_session, user_id=data_model_user.id, name="Portfolio Star", description=None, model=ModelDefinition(schema_version=2))

    with pytest.raises(service.ImmutableDataModelNameError):
        service.update_saved_model(db_session, model_id=saved.id, user_id=data_model_user.id, name="Renamed", description=None, model=ModelDefinition(schema_version=2))

    service.delete_saved_model(db_session, model_id=saved.id, user_id=data_model_user.id)

    with pytest.raises(service.DataModelNotFoundError):
        service.get_saved_model(db_session, model_id=saved.id, user_id=data_model_user.id)


def test_saved_model_read_and_test_return_missing_connection_diagnostics(db_session, data_model_user, sqlite_connection, tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    monkeypatch.setenv("APP_DATASETS_ROOT", str(datasets_root))
    create_star_database(datasets_root / "portfolio.db")
    saved = service.create_saved_model(db_session, user_id=data_model_user.id, name="Portfolio Star", description=None, model=star_definition(sqlite_connection.id))
    db_session.delete(sqlite_connection)
    db_session.commit()

    response = service.saved_model_response(service.get_saved_model(db_session, model_id=saved.id, user_id=data_model_user.id), db=db_session, user_id=data_model_user.id)
    result = service.test_saved_model(db_session, model_id=saved.id, user_id=data_model_user.id, datasets_root=datasets_root)

    assert response.last_test_errors[0].code == "missing_connection"
    assert response.test_status == "stale"
    assert "referenced Connection is missing" in response.last_test_errors[0].message
    assert result.succeeded is False
    assert result.errors[0].code == "missing_connection"
    assert "portfolio.db" not in result.model_dump_json()


def test_saved_model_replacement_source_preserves_configuration_and_revalidates(db_session, data_model_user, sqlite_connection, tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    monkeypatch.setenv("APP_DATASETS_ROOT", str(datasets_root))
    create_star_database(datasets_root / "portfolio.db")
    create_star_database(datasets_root / "replacement.db")
    saved = service.create_saved_model(db_session, user_id=data_model_user.id, name="Portfolio Star", description=None, model=star_definition(sqlite_connection.id))
    replacement = DatabaseConnection(
        user_id=data_model_user.id,
        label="Replacement",
        normalized_label="replacement",
        driver="sqlite",
        database_path="replacement.db",
    )
    db_session.add(replacement)
    db_session.delete(sqlite_connection)
    db_session.commit()
    db_session.refresh(replacement)

    repaired = service.replace_model_connection(db_session, model_id=saved.id, user_id=data_model_user.id, old_connection_id=sqlite_connection.id, new_connection_id=replacement.id)
    result = service.test_saved_model(db_session, model_id=saved.id, user_id=data_model_user.id, datasets_root=datasets_root)

    repaired_model = service.saved_model_response(repaired).model
    assert repaired_model.sources[0].connection_id == replacement.id
    assert repaired_model.sources[0].alias == "portfolio"
    assert repaired_model.fact_table is not None
    assert repaired_model.fact_table.alias == "fact_loans"
    assert repaired_model.dimensions[0].alias == "dim_customers"
    assert repaired_model.relationships[0].key_pairs[0].child_column == "customer_id"
    assert repaired_model.business_rules[0].expression == "upper(dim_customers.name)"
    assert result.succeeded is True
