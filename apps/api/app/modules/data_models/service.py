from pathlib import Path
from typing import Any, cast

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.connections import repository as connection_repository
from app.modules.data_models import repository
from app.modules.data_models import diagnostics
from app.modules.data_models.models import AnalyticalDataModel
from app.modules.data_models.query_compiler import run_zero_row_dry_run
from app.modules.data_models.rule_parser import validate_business_rules
from app.modules.data_models.schema_inspection import inspect_connection_schema
from app.modules.data_models.schemas import DataModelStatus, DataModelTestResponse, Diagnostic, ModelDefinition, SavedDataModelResponse, SavedDataModelsResponse, SavedDataModelSummary
from app.modules.data_models.status import calculate_saved_status, mark_after_saved_edit
from app.modules.data_models.validation import replace_connection_references, validate_model_definition


def normalize_data_model_name(name: str) -> str:
    return name.strip().casefold()


class DataModelServiceError(Exception):
    pass


class DataModelNotFoundError(DataModelServiceError):
    pass


class DuplicateDataModelNameError(DataModelServiceError):
    pass


class ImmutableDataModelNameError(DataModelServiceError):
    pass


class InvalidDataModelNameError(DataModelServiceError):
    pass


def get_owned_model_or_404(db: Session, *, model_id: str, user_id: str) -> AnalyticalDataModel:
    data_model = repository.get_model_for_user(db, model_id=model_id, user_id=user_id)
    if data_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data model not found.")
    return data_model


def list_saved_models(db: Session, *, user_id: str, status: DataModelStatus | None = None) -> SavedDataModelsResponse:
    return SavedDataModelsResponse(items=[_summary(record) for record in repository.list_models_for_user(db, user_id=user_id, status=status)])


def get_saved_model(db: Session, *, model_id: str, user_id: str) -> AnalyticalDataModel:
    record = repository.get_model_for_user(db, model_id=model_id, user_id=user_id)
    if record is None:
        raise DataModelNotFoundError("Data model not found.")
    return record


def create_saved_model(db: Session, *, user_id: str, name: str, description: str | None, model: ModelDefinition) -> AnalyticalDataModel:
    trimmed_name = _validate_name(name)
    normalized_name = normalize_data_model_name(trimmed_name)
    if repository.get_model_by_normalized_name(db, user_id=user_id, normalized_name=normalized_name) is not None:
        raise DuplicateDataModelNameError("A data model with this name already exists.")
    validation = validate_model_definition(model)
    if validation.errors and model.fact_table is not None:
        raise ValueError(validation.errors[0].message)
    record = AnalyticalDataModel(
        user_id=user_id,
        name=trimmed_name,
        normalized_name=normalized_name,
        description=description,
        model_json=model.model_dump(mode="json"),
        test_status=calculate_saved_status(model),
        last_test_errors_json=[],
        last_test_warnings_json=[],
        diagnostics_stale=False,
    )
    return repository.create_model(db, record)


def update_saved_model(db: Session, *, model_id: str, user_id: str, name: str, description: str | None, model: ModelDefinition) -> AnalyticalDataModel:
    record = get_saved_model(db, model_id=model_id, user_id=user_id)
    if _validate_name(name).casefold() != record.name.casefold():
        raise ImmutableDataModelNameError("Data model names cannot be changed.")
    validation = validate_model_definition(model)
    if validation.errors and model.fact_table is not None:
        raise ValueError(validation.errors[0].message)
    previous_status = cast(DataModelStatus, record.test_status)
    record.description = description
    record.model_json = model.model_dump(mode="json")
    record.test_status = mark_after_saved_edit(previous_status=previous_status, model=model)
    if record.last_test_errors_json or record.last_test_warnings_json:
        record.diagnostics_stale = True
        record.last_test_errors_json = _mark_stale(record.last_test_errors_json)
        record.last_test_warnings_json = _mark_stale(record.last_test_warnings_json)
    else:
        record.diagnostics_stale = False
    db.commit()
    db.refresh(record)
    return record


def delete_saved_model(db: Session, *, model_id: str, user_id: str) -> None:
    repository.delete_model(db, get_saved_model(db, model_id=model_id, user_id=user_id))


def test_saved_model(db: Session, *, model_id: str, user_id: str, datasets_root: Path) -> DataModelTestResponse:
    record = get_saved_model(db, model_id=model_id, user_id=user_id)
    result = test_unsaved_model(db, user_id=user_id, model=_model_from_record(record), datasets_root=datasets_root)
    from app.modules.data_models.models import _utc_now_naive

    now = _utc_now_naive()
    record.last_tested_at = now
    record.last_test_errors_json = [item.model_dump(mode="json") for item in result.errors]
    record.last_test_warnings_json = [item.model_dump(mode="json") for item in result.warnings]
    record.diagnostics_stale = False
    if result.succeeded:
        record.test_status = "tested"
        record.last_test_succeeded_at = now
    else:
        record.test_status = "failed"
        record.last_test_failed_at = now
    db.commit()
    db.refresh(record)
    return result


def replace_model_connection(db: Session, *, model_id: str, user_id: str, old_connection_id: str, new_connection_id: str) -> AnalyticalDataModel:
    record = get_saved_model(db, model_id=model_id, user_id=user_id)
    if connection_repository.get_connection_for_user(db, connection_id=new_connection_id, user_id=user_id) is None:
        raise ValueError("Replacement connection not found.")
    repaired_model = replace_connection_references(_model_from_record(record), old_connection_id=old_connection_id, new_connection_id=new_connection_id)
    record.model_json = repaired_model.model_dump(mode="json")
    record.test_status = calculate_saved_status(repaired_model)
    record.diagnostics_stale = False
    record.last_test_errors_json = []
    db.commit()
    db.refresh(record)
    return record


def saved_model_response(record: AnalyticalDataModel, *, db: Session | None = None, user_id: str | None = None) -> SavedDataModelResponse:
    errors = [Diagnostic.model_validate(item) for item in (record.last_test_errors_json or [])]
    if db is not None and user_id is not None:
        errors = [*_missing_connection_diagnostics(db, user_id=user_id, model=_model_from_record(record)), *errors]
    return SavedDataModelResponse(
        **_summary(record).model_dump(),
        model=_model_from_record(record),
        last_test_errors=errors,
        last_test_warnings=[Diagnostic.model_validate(item) for item in (record.last_test_warnings_json or [])],
    )


def inspect_owned_connection_schema(db: Session, *, connection_id: str, user_id: str, datasets_root: Path):
    connection = connection_repository.get_connection_for_user(db, connection_id=connection_id, user_id=user_id)
    if connection is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found.")
    try:
        return inspect_connection_schema(connection, datasets_root=datasets_root)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


def test_unsaved_model(db: Session, *, user_id: str, model: ModelDefinition, datasets_root: Path) -> DataModelTestResponse:
    missing_connection_errors = _missing_connection_diagnostics(db, user_id=user_id, model=model)
    if missing_connection_errors:
        return DataModelTestResponse(succeeded=False, status="failed", errors=missing_connection_errors, warnings=[])
    validation = validate_model_definition(model)
    rule_errors = validate_business_rules(model.business_rules, table_columns=_collect_known_columns(db, user_id=user_id, model=model, datasets_root=datasets_root)).errors
    errors = [*validation.errors, *rule_errors]
    warnings = validation.warnings
    if errors:
        return DataModelTestResponse(succeeded=False, status=calculate_saved_status(model), errors=errors, warnings=warnings)
    try:
        run_zero_row_dry_run(db, user_id=user_id, model=model, datasets_root=datasets_root)
    except Exception as exc:
        return DataModelTestResponse(
            succeeded=False,
            status="failed",
            errors=[diagnostics.error("dry_run_failed", diagnostics.safe_error_message(exc), section="test")],
            warnings=warnings,
        )
    return DataModelTestResponse(succeeded=True, status="tested", errors=[], warnings=warnings)


setattr(test_unsaved_model, "__test__", False)


def _collect_known_columns(db: Session, *, user_id: str, model: ModelDefinition, datasets_root: Path) -> dict[str, set[str]]:
    known: dict[str, set[str]] = {}
    table_refs = []
    if model.fact_table is not None:
        table_refs.append((model.fact_table.alias, model.fact_table.connection_id, model.fact_table.table))
    table_refs.extend((dimension.alias, dimension.connection_id, dimension.table) for dimension in model.dimensions)
    for alias, connection_id, table_name in table_refs:
        connection = connection_repository.get_connection_for_user(db, connection_id=connection_id, user_id=user_id)
        if connection is None:
            continue
        try:
            schema = inspect_connection_schema(connection, datasets_root=datasets_root)
        except ValueError:
            continue
        schema_object = next((item for item in schema.objects if item.name == table_name), None)
        if schema_object is not None:
            known[alias] = {column.name for column in schema_object.columns}
    return known


def _missing_connection_diagnostics(db: Session, *, user_id: str, model: ModelDefinition) -> list[Diagnostic]:
    missing_ids = [connection_id for connection_id in _referenced_connection_ids(model) if connection_repository.get_connection_for_user(db, connection_id=connection_id, user_id=user_id) is None]
    return [
        diagnostics.error(
            "missing_connection",
            "A referenced Connection is missing. Select a replacement source to repair this model.",
            section="sources",
            connection_id=connection_id,
        )
        for connection_id in dict.fromkeys(missing_ids)
    ]


def _referenced_connection_ids(model: ModelDefinition) -> list[str]:
    ids = [source.connection_id for source in model.sources]
    if model.fact_table is not None:
        ids.append(model.fact_table.connection_id)
    ids.extend(dimension.connection_id for dimension in model.dimensions)
    return ids


def _validate_name(name: str) -> str:
    trimmed_name = name.strip()
    if not trimmed_name:
        raise InvalidDataModelNameError("Data model name is required.")
    return trimmed_name


def _model_from_record(record: AnalyticalDataModel) -> ModelDefinition:
    return ModelDefinition.model_validate(record.model_json)


def _summary(record: AnalyticalDataModel) -> SavedDataModelSummary:
    return SavedDataModelSummary.model_validate(record)


def _mark_stale(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{**item, "stale": True} for item in items]
