from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.modules.auth.models import InternalUser
from app.modules.auth.service import require_current_user
from app.modules.connections import repository, service
from app.modules.connections.schemas import (
    ConnectionCreateRequest,
    ConnectionTestRequest,
    ConnectionTestResult,
    ConnectionUpdateRequest,
    DatabaseOptionsResponse,
    SavedConnection,
    SavedConnectionTestResult,
    SavedConnectionsResponse,
)

router = APIRouter(prefix="/connections", tags=["connections"])


def require_connection_user(user: InternalUser = Depends(require_current_user)) -> InternalUser:
    return user


def ensure_sqlite_driver(driver: str) -> None:
    if driver != "sqlite":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only SQLite connections are supported.")


def validate_database(settings: Settings, driver: str, database_path: str):
    ensure_sqlite_driver(driver)
    try:
        return service.validate_database_reference(settings, database_path)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/databases", response_model=DatabaseOptionsResponse)
def list_database_options(
    _user: InternalUser = Depends(require_connection_user),
    settings: Settings = Depends(get_settings),
) -> DatabaseOptionsResponse:
    return DatabaseOptionsResponse(databases=service.discover_database_options(settings))


@router.get("", response_model=SavedConnectionsResponse)
def list_saved_connections(
    user: InternalUser = Depends(require_connection_user),
    db: Session = Depends(get_db_session),
) -> SavedConnectionsResponse:
    return SavedConnectionsResponse(connections=[SavedConnection.model_validate(item) for item in repository.list_connections_for_user(db, user.id)])


@router.post("", response_model=SavedConnection, status_code=status.HTTP_201_CREATED)
def create_saved_connection(
    payload: ConnectionCreateRequest,
    user: InternalUser = Depends(require_connection_user),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> SavedConnection:
    label = payload.label.strip()
    normalized_label = service.normalize_label(payload.label)
    if not normalized_label:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Connection label is required.")
    validate_database(settings, payload.driver, payload.database_path)
    if repository.get_connection_by_normalized_label(db, user_id=user.id, normalized_label=normalized_label):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A connection with this label already exists.")

    try:
        connection = repository.create_connection(
            db,
            user_id=user.id,
            label=label,
            normalized_label=normalized_label,
            driver=payload.driver,
            database_path=payload.database_path,
        )
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A connection with this label already exists.") from exc
    return SavedConnection.model_validate(connection)


def get_owned_connection_or_404(db: Session, *, connection_id: str, user_id: str):
    connection = repository.get_connection_for_user(db, connection_id=connection_id, user_id=user_id)
    if connection is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found.")
    return connection


@router.get("/{connection_id}", response_model=SavedConnection)
def read_saved_connection(
    connection_id: str,
    user: InternalUser = Depends(require_connection_user),
    db: Session = Depends(get_db_session),
) -> SavedConnection:
    return SavedConnection.model_validate(get_owned_connection_or_404(db, connection_id=connection_id, user_id=user.id))


@router.put("/{connection_id}", response_model=SavedConnection)
def update_saved_connection(
    connection_id: str,
    payload: ConnectionUpdateRequest,
    user: InternalUser = Depends(require_connection_user),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> SavedConnection:
    connection = get_owned_connection_or_404(db, connection_id=connection_id, user_id=user.id)
    validate_database(settings, payload.driver, payload.database_path)
    updated = repository.update_connection_database(db, connection=connection, driver=payload.driver, database_path=payload.database_path)
    return SavedConnection.model_validate(updated)


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_connection(
    connection_id: str,
    user: InternalUser = Depends(require_connection_user),
    db: Session = Depends(get_db_session),
) -> None:
    connection = get_owned_connection_or_404(db, connection_id=connection_id, user_id=user.id)
    service.delete_connection_metadata(db, connection)


@router.post("/{connection_id}/test", response_model=SavedConnectionTestResult)
def test_saved_connection(
    connection_id: str,
    user: InternalUser = Depends(require_connection_user),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> SavedConnectionTestResult:
    connection = get_owned_connection_or_404(db, connection_id=connection_id, user_id=user.id)
    database_file = validate_database(settings, connection.driver, connection.database_path)
    try:
        service.test_sqlite_connection(database_file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    updated = repository.update_connection_last_tested_at(db, connection=connection)
    return SavedConnectionTestResult(ok=True, message="Connection test succeeded.", connection=SavedConnection.model_validate(updated))


@router.post("/test", response_model=ConnectionTestResult)
def test_unsaved_connection(
    payload: ConnectionTestRequest,
    _user: InternalUser = Depends(require_connection_user),
    settings: Settings = Depends(get_settings),
) -> ConnectionTestResult:
    database_file = validate_database(settings, payload.driver, payload.database_path)
    try:
        service.test_sqlite_connection(database_file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ConnectionTestResult(ok=True, message="Connection test succeeded.")
