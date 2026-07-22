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
            "schema_version": 2,
            "sources": [
                {"connection_id": fact_connection.id, "alias": "fact_source"},
                {"connection_id": dim_connection.id, "alias": "dim_source"},
            ],
            "fact_table": {"id": "fact_loans", "connection_id": fact_connection.id, "table": "loans", "object_type": "table", "alias": "fact", "primary_key": ["account_id"]},
            "dimensions": [
                {"id": "dim_customer", "connection_id": dim_connection.id, "table": "customers", "object_type": "table", "alias": "customer", "primary_key": ["customer_id"]}
            ],
            "relationships": [
                {
                    "id": "rel_customer",
                    "parent_table_id": "fact_loans",
                    "child_table_id": "dim_customer",
                    "join_type": "left",
                    "key_pairs": [{"parent_column": "customer_id", "child_column": "customer_id"}],
                }
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
            "schema_version": 2,
            "sources": [{"connection_id": fact_connection.id, "alias": "fact_source"}],
            "fact_table": {"id": "fact_loans", "connection_id": fact_connection.id, "table": "loans", "object_type": "table", "alias": "fact", "primary_key": ["account_id"]},
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


def test_zero_row_dry_run_compiles_a_chinook_tree_when_relationships_are_out_of_order(
    db_session, data_model_user, tmp_path
) -> None:
    datasets_root = tmp_path / "datasets"
    datasets_root.mkdir()
    create_database(
        datasets_root / "chinook.db",
        """
        create table Employee (EmployeeId integer primary key, Name text);
        create table Customer (CustomerId integer primary key, SupportRepId integer, foreign key (SupportRepId) references Employee(EmployeeId));
        create table Invoice (InvoiceId integer primary key, CustomerId integer, foreign key (CustomerId) references Customer(CustomerId));
        create table Artist (ArtistId integer primary key, Name text);
        create table Album (AlbumId integer primary key, ArtistId integer, foreign key (ArtistId) references Artist(ArtistId));
        create table Genre (GenreId integer primary key, Name text);
        create table MediaType (MediaTypeId integer primary key, Name text);
        create table Track (
            TrackId integer primary key,
            AlbumId integer,
            GenreId integer,
            MediaTypeId integer,
            foreign key (AlbumId) references Album(AlbumId),
            foreign key (GenreId) references Genre(GenreId),
            foreign key (MediaTypeId) references MediaType(MediaTypeId)
        );
        create table InvoiceLine (
            InvoiceLineId integer primary key,
            InvoiceId integer,
            TrackId integer,
            foreign key (InvoiceId) references Invoice(InvoiceId),
            foreign key (TrackId) references Track(TrackId)
        );
        """,
    )
    connection = DatabaseConnection(
        user_id=data_model_user.id,
        label="Chinook",
        normalized_label="chinook",
        driver="sqlite",
        database_path="chinook.db",
    )
    db_session.add(connection)
    db_session.commit()

    dimensions = [
        ("invoice", "Invoice", "InvoiceId"),
        ("customer", "Customer", "CustomerId"),
        ("employee", "Employee", "EmployeeId"),
        ("track", "Track", "TrackId"),
        ("album", "Album", "AlbumId"),
        ("artist", "Artist", "ArtistId"),
        ("genre", "Genre", "GenreId"),
        ("media_type", "MediaType", "MediaTypeId"),
    ]
    relationships = [
        ("rel_employee", "dim_customer", "dim_employee", "SupportRepId", "EmployeeId"),
        ("rel_artist", "dim_album", "dim_artist", "ArtistId", "ArtistId"),
        ("rel_customer", "dim_invoice", "dim_customer", "CustomerId", "CustomerId"),
        ("rel_album", "dim_track", "dim_album", "AlbumId", "AlbumId"),
        ("rel_media_type", "dim_track", "dim_media_type", "MediaTypeId", "MediaTypeId"),
        ("rel_invoice", "fact_invoice_line", "dim_invoice", "InvoiceId", "InvoiceId"),
        ("rel_genre", "dim_track", "dim_genre", "GenreId", "GenreId"),
        ("rel_track", "fact_invoice_line", "dim_track", "TrackId", "TrackId"),
    ]
    model = ModelDefinition.model_validate(
        {
            "schema_version": 2,
            "sources": [{"connection_id": connection.id, "alias": "chinook"}],
            "fact_table": {
                "id": "fact_invoice_line",
                "connection_id": connection.id,
                "table": "InvoiceLine",
                "object_type": "table",
                "alias": "invoice_line",
                "primary_key": ["InvoiceLineId"],
            },
            "dimensions": [
                {
                    "id": f"dim_{alias}",
                    "connection_id": connection.id,
                    "table": table,
                    "object_type": "table",
                    "alias": alias,
                    "primary_key": [primary_key],
                }
                for alias, table, primary_key in dimensions
            ],
            "relationships": [
                {
                    "id": relationship_id,
                    "parent_table_id": parent_id,
                    "child_table_id": child_id,
                    "join_type": "left",
                    "key_pairs": [{"parent_column": parent_column, "child_column": child_column}],
                }
                for relationship_id, parent_id, child_id, parent_column, child_column in relationships
            ],
            "business_rules": [
                {"id": "rule_artist", "name": "artist_upper", "expression": "upper(artist.Name)", "output_type": "text"}
            ],
            "measures": [],
        }
    )

    result = test_unsaved_model(db_session, user_id=data_model_user.id, model=model, datasets_root=datasets_root)

    assert result.succeeded is True
    assert result.errors == []
