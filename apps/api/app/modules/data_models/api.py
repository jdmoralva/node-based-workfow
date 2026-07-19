from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.modules.auth.models import InternalUser
from app.modules.auth.service import require_current_user
from app.modules.data_models import service
from app.modules.data_models.schemas import ConnectionSchemaResponse, DataModelCreateRequest, DataModelStatus, DataModelTestRequest, DataModelTestResponse, DataModelUpdateRequest, SavedDataModelResponse, SavedDataModelsResponse

router = APIRouter(prefix="/data-models", tags=["data-models"])


def require_data_model_user(user: InternalUser = Depends(require_current_user)) -> InternalUser:
    return user


@router.get("/connections/{connection_id}/schema", response_model=ConnectionSchemaResponse)
def inspect_connection_schema_endpoint(
    connection_id: str,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> ConnectionSchemaResponse:
    return service.inspect_owned_connection_schema(db, connection_id=connection_id, user_id=user.id, datasets_root=settings.resolved_datasets_root)


@router.post("/test", response_model=DataModelTestResponse)
def test_unsaved_data_model(
    payload: DataModelTestRequest,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> DataModelTestResponse:
    return service.test_unsaved_model(db, user_id=user.id, model=payload.model, datasets_root=settings.resolved_datasets_root)


@router.get("", response_model=SavedDataModelsResponse)
def list_data_models(
    status: DataModelStatus | None = None,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
) -> SavedDataModelsResponse:
    return service.list_saved_models(db, user_id=user.id, status=status)


@router.post("", response_model=SavedDataModelResponse, status_code=status.HTTP_201_CREATED)
def create_data_model(
    payload: DataModelCreateRequest,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
) -> SavedDataModelResponse:
    try:
        record = service.create_saved_model(db, user_id=user.id, name=payload.name, description=payload.description, model=payload.model)
    except service.DuplicateDataModelNameError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (service.InvalidDataModelNameError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return service.saved_model_response(record)


@router.get("/{model_id}", response_model=SavedDataModelResponse)
def read_data_model(
    model_id: str,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
) -> SavedDataModelResponse:
    try:
        return service.saved_model_response(service.get_saved_model(db, model_id=model_id, user_id=user.id), db=db, user_id=user.id)
    except service.DataModelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put("/{model_id}", response_model=SavedDataModelResponse)
def update_data_model(
    model_id: str,
    payload: DataModelUpdateRequest,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
) -> SavedDataModelResponse:
    try:
        record = service.update_saved_model(db, model_id=model_id, user_id=user.id, name=payload.name, description=payload.description, model=payload.model)
    except service.DataModelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except (service.ImmutableDataModelNameError, service.InvalidDataModelNameError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return service.saved_model_response(record, db=db, user_id=user.id)


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_model(
    model_id: str,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
) -> Response:
    try:
        service.delete_saved_model(db, model_id=model_id, user_id=user.id)
    except service.DataModelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{model_id}/test", response_model=DataModelTestResponse)
def test_saved_data_model(
    model_id: str,
    user: InternalUser = Depends(require_data_model_user),
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> DataModelTestResponse:
    try:
        return service.test_saved_model(db, model_id=model_id, user_id=user.id, datasets_root=settings.resolved_datasets_root)
    except service.DataModelNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
