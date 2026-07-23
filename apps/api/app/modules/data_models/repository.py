from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.data_models.models import AnalyticalDataModel


def get_model_for_user(db: Session, *, model_id: str, user_id: str) -> AnalyticalDataModel | None:
    return db.scalar(select(AnalyticalDataModel).where(AnalyticalDataModel.id == model_id, AnalyticalDataModel.user_id == user_id))


def get_model_by_normalized_name(db: Session, *, user_id: str, normalized_name: str) -> AnalyticalDataModel | None:
    return db.scalar(
        select(AnalyticalDataModel).where(
            AnalyticalDataModel.user_id == user_id,
            AnalyticalDataModel.normalized_name == normalized_name,
        )
    )


def list_models_for_user(db: Session, *, user_id: str, status: str | None = None) -> list[AnalyticalDataModel]:
    statement = select(AnalyticalDataModel).where(AnalyticalDataModel.user_id == user_id).order_by(AnalyticalDataModel.updated_at.desc())
    if status is not None:
        statement = statement.where(AnalyticalDataModel.test_status == status)
    return list(db.scalars(statement).all())


def create_model(db: Session, model: AnalyticalDataModel) -> AnalyticalDataModel:
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def delete_model(db: Session, model: AnalyticalDataModel) -> None:
    db.delete(model)
    db.commit()
