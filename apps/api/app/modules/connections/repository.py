from datetime import UTC, datetime

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.modules.connections.models import DatabaseConnection


def list_connections_for_user(db: Session, user_id: str) -> list[DatabaseConnection]:
    return list(db.scalars(select(DatabaseConnection).where(DatabaseConnection.user_id == user_id).order_by(DatabaseConnection.label)))


def get_connection_for_user(db: Session, *, connection_id: str, user_id: str) -> DatabaseConnection | None:
    return db.scalar(select(DatabaseConnection).where(DatabaseConnection.id == connection_id, DatabaseConnection.user_id == user_id))


def get_connection_by_normalized_label(db: Session, *, user_id: str, normalized_label: str) -> DatabaseConnection | None:
    return db.scalar(
        select(DatabaseConnection).where(
            DatabaseConnection.user_id == user_id,
            DatabaseConnection.normalized_label == normalized_label,
        )
    )


def create_connection(
    db: Session,
    *,
    user_id: str,
    label: str,
    normalized_label: str,
    driver: str,
    database_path: str,
) -> DatabaseConnection:
    connection = DatabaseConnection(
        user_id=user_id,
        label=label,
        normalized_label=normalized_label,
        driver=driver,
        database_path=database_path,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return connection


def update_connection_database(db: Session, *, connection: DatabaseConnection, driver: str, database_path: str) -> DatabaseConnection:
    connection.driver = driver
    connection.database_path = database_path
    db.commit()
    db.refresh(connection)
    return connection


def update_connection_last_tested_at(db: Session, *, connection: DatabaseConnection) -> DatabaseConnection:
    connection.last_tested_at = datetime.now(UTC).replace(tzinfo=None)
    db.commit()
    db.refresh(connection)
    return connection


def delete_connection(db: Session, *, connection: DatabaseConnection) -> None:
    db.delete(connection)
    db.commit()
