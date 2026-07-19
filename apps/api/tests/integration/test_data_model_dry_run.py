import sqlite3

from app.modules.connections.models import DatabaseConnection
from app.modules.data_models.schemas import ModelDefinition
from app.modules.data_models import service as data_model_service
from app.modules.data_models.service import test_unsaved_model


def create_database(path, ddl: str) -> None:
    with sqlite3.connect(path) as connection:
        connection.executescript(ddl)


def test_zero_row_dry_run_compiles_across_saved_sqlite_connections(db_session, data_model_user, tmp_path) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    create_database(datasets_root / "fact.db", "create table loans (account_id text primary key, customer_id text, balance real);")
    create_database(datasets_root / "dims.db", "create table customers (customer_id text primary key, name text);")
    fact_connection = DatabaseConnection(user_id=data_model_user.id, label="Fact", normalized_label="fact", driver="sqlite", database_path="fact.db")
    dim_connection = DatabaseConnection(user_id=data_model_user.id, label="Dims", normalized_label="dims", driver="sqlite", database_path="dims.db")
    db_session.add_all([fact_connection, dim_connection])
    db_session.commit()

    model = ModelDefinition.model_validate(
        {
            "sources": [
                {"connection_id": fact_connection.id, "alias": "fact_source"},
                {"connection_id": dim_connection.id, "alias": "dim_source"},
            ],
            "fact_table": {"connection_id": fact_connection.id, "table": "loans", "object_type": "table", "alias": "fact", "primary_key": ["account_id"]},
            "dimensions": [
                {"id": "dim_customer", "connection_id": dim_connection.id, "table": "customers", "object_type": "table", "alias": "customer", "primary_key": ["customer_id"]}
            ],
            "relationships": [
                {"id": "rel_customer", "dimension_id": "dim_customer", "join_type": "left", "key_pairs": [{"fact_column": "customer_id", "dimension_column": "customer_id"}]}
            ],
            "business_rules": [{"id": "rule_1", "name": "name_upper", "expression": "upper(customer.name)", "output_type": "text"}],
            "measures": [],
        }
    )

    result = test_unsaved_model(db_session, user_id=data_model_user.id, model=model, datasets_root=datasets_root)

    assert result.succeeded is True
    assert result.status == "tested"
    assert result.errors == []
    assert "select" not in result.model_dump_json().lower()
    assert "fact.db" not in result.model_dump_json()


def test_dry_run_failure_returns_only_safe_diagnostics(db_session, data_model_user, tmp_path, monkeypatch) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    create_database(datasets_root / "fact.db", "create table loans (account_id text primary key, customer_id text, balance real);")
    fact_connection = DatabaseConnection(user_id=data_model_user.id, label="Fact", normalized_label="fact", driver="sqlite", database_path="fact.db")
    db_session.add(fact_connection)
    db_session.commit()
    model = ModelDefinition.model_validate(
        {
            "sources": [{"connection_id": fact_connection.id, "alias": "fact_source"}],
            "fact_table": {"connection_id": fact_connection.id, "table": "loans", "object_type": "table", "alias": "fact", "primary_key": ["account_id"]},
            "dimensions": [],
            "relationships": [],
            "business_rules": [],
            "measures": [],
        }
    )

    def fail_with_sensitive_details(*_args, **_kwargs) -> None:
        raise RuntimeError(
            "sqlite3.OperationalError near SELECT * FROM loans; C:/Users/User/datasets/fact.db "
            "Traceback stack row={'account_id': 'A1'} profile=12ms raw driver failure"
        )

    monkeypatch.setattr(data_model_service, "run_zero_row_dry_run", fail_with_sensitive_details)

    result = test_unsaved_model(db_session, user_id=data_model_user.id, model=model, datasets_root=datasets_root)
    payload = result.model_dump_json().lower()

    assert result.succeeded is False
    assert result.errors[0].code == "dry_run_failed"
    assert result.errors[0].message == "Data model operation failed."
    for forbidden in ["select", "c:/", "fact.db", "traceback", "stack", "sqlite3", "operationalerror", "row={'", "profile", "driver"]:
        assert forbidden not in payload
