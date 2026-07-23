from app.modules.data_models.schemas import DataModelStatus, ModelDefinition
from app.modules.data_models.validation import DRAFT_GAP_CODES, validate_model_definition


def is_structurally_complete(model: ModelDefinition) -> bool:
    return not any(item.code in DRAFT_GAP_CODES for item in validate_model_definition(model).errors)


def calculate_saved_status(model: ModelDefinition, *, tested: bool = False, failed: bool = False, stale: bool = False) -> DataModelStatus:
    if not is_structurally_complete(model):
        return "draft"
    if stale:
        return "stale"
    if failed:
        return "failed"
    if tested:
        return "tested"
    return "untested"


def mark_after_saved_edit(*, previous_status: DataModelStatus, model: ModelDefinition) -> DataModelStatus:
    if not is_structurally_complete(model):
        return "draft"
    if previous_status in {"tested", "failed", "stale"}:
        return "stale"
    return "untested"
