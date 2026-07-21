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
from app.modules.data_models.validation import blocking_save_errors, replace_connection_references, validate_model_definition


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
    summaries = [_summary(record, db=db, user_id=user_id) for record in repository.list_models_for_user(db, user_id=user_id)]
    return SavedDataModelsResponse(items=[item for item in summaries if status is None or item.test_status == status])


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
    save_errors = blocking_save_errors(validation)
    if save_errors:
        raise ValueError(save_errors[0].message)
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
    save_errors = blocking_save_errors(validation)
    if save_errors:
        raise ValueError(save_errors[0].message)
    model_json = model.model_dump(mode="json")
    if record.description == description and record.model_json == model_json:
        return record
    previous_status = cast(DataModelStatus, record.test_status)
    record.description = description
    record.model_json = model_json
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
    persisted_status: DataModelStatus = "tested" if result.succeeded else "failed"
    if result.succeeded:
        record.last_test_succeeded_at = now
    else:
        record.last_test_failed_at = now
    record.test_status = persisted_status
    db.commit()
    db.refresh(record)
    return result.model_copy(update={"status": persisted_status})


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
        **_summary(record, db=db, user_id=user_id).model_dump(),
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
    known_columns, schema_errors = _collect_schema_context(db, user_id=user_id, model=model, datasets_root=datasets_root)
    rule_errors = validate_business_rules(model.business_rules, table_columns=known_columns).errors
    errors = [*validation.errors, *schema_errors, *rule_errors]
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


def _collect_schema_context(
    db: Session,
    *,
    user_id: str,
    model: ModelDefinition,
    datasets_root: Path,
) -> tuple[dict[str, set[str]], list[Diagnostic]]:
    known: dict[str, set[str]] = {}
    errors: list[Diagnostic] = []
    schema_by_connection: dict[str, Any] = {}
    connection_ids = _referenced_connection_ids(model)
    for connection_id in dict.fromkeys(connection_ids):
        connection = connection_repository.get_connection_for_user(db, connection_id=connection_id, user_id=user_id)
        if connection is None:
            continue
        try:
            schema_by_connection[connection_id] = inspect_connection_schema(connection, datasets_root=datasets_root)
        except ValueError:
            errors.append(
                diagnostics.error(
                    "schema_unavailable",
                    "Schema metadata could not be loaded for a referenced Connection.",
                    section="sources",
                    connection_id=connection_id,
                )
            )

    fact_columns: set[str] | None = None
    if model.fact_table is not None:
        schema = schema_by_connection.get(model.fact_table.connection_id)
        schema_object = next((item for item in schema.objects if item.name == model.fact_table.table), None) if schema is not None else None
        if schema is not None and schema_object is None:
            errors.append(diagnostics.error("unknown_fact_object", "The selected fact table or view is unavailable.", section="fact_table"))
        elif schema_object is not None:
            fact_columns = {column.name for column in schema_object.columns}
            known[model.fact_table.alias] = fact_columns
            if schema_object.object_type != model.fact_table.object_type:
                errors.append(diagnostics.error("fact_object_type_changed", "The selected fact object type has changed.", section="fact_table"))
            if any(column not in fact_columns for column in model.fact_table.primary_key):
                errors.append(diagnostics.error("unknown_fact_primary_key", "A selected fact primary-key column is unavailable.", section="fact_table"))

    dimension_columns: dict[str, set[str]] = {}
    dimensions_by_id = {dimension.id: dimension for dimension in model.dimensions}
    for dimension in model.dimensions:
        schema = schema_by_connection.get(dimension.connection_id)
        schema_object = next((item for item in schema.objects if item.name == dimension.table), None) if schema is not None else None
        if schema is not None and schema_object is None:
            errors.append(
                diagnostics.error("unknown_dimension_object", "A selected dimension table or view is unavailable.", section="dimensions", id=dimension.id)
            )
            continue
        if schema_object is None:
            continue
        columns = {column.name for column in schema_object.columns}
        known[dimension.alias] = columns
        dimension_columns[dimension.id] = columns
        if schema_object.object_type != dimension.object_type:
            errors.append(
                diagnostics.error("dimension_object_type_changed", "A selected dimension object type has changed.", section="dimensions", id=dimension.id)
            )
        if any(column not in columns for column in dimension.primary_key):
            errors.append(
                diagnostics.error(
                    "unknown_dimension_primary_key",
                    "A selected dimension primary-key column is unavailable.",
                    section="dimensions",
                    id=dimension.id,
                )
            )

    for relationship in model.relationships:
        dimension = dimensions_by_id.get(relationship.dimension_id)
        if dimension is None:
            continue
        columns = dimension_columns.get(dimension.id)
        for pair in relationship.key_pairs:
            if fact_columns is not None and pair.fact_column not in fact_columns:
                errors.append(
                    diagnostics.error(
                        "unknown_relationship_fact_column",
                        "A selected relationship fact column is unavailable.",
                        section="relationships",
                        id=relationship.id,
                    )
                )
            if columns is not None and pair.dimension_column not in columns:
                errors.append(
                    diagnostics.error(
                        "unknown_relationship_dimension_column",
                        "A selected relationship dimension column is unavailable.",
                        section="relationships",
                        id=relationship.id,
                    )
                )
    return known, errors


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


def _summary(
    record: AnalyticalDataModel,
    *,
    db: Session | None = None,
    user_id: str | None = None,
) -> SavedDataModelSummary:
    summary = SavedDataModelSummary.model_validate(record)
    if db is None or user_id is None:
        return summary
    model = _model_from_record(record)
    if summary.test_status != "failed" and _missing_connection_diagnostics(db, user_id=user_id, model=model):
        return summary.model_copy(update={"test_status": calculate_saved_status(model, stale=True)})
    return summary


def _mark_stale(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [{**item, "stale": True} for item in items]
