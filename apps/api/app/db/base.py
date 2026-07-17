from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.modules.auth import models as auth_models  # noqa: E402,F401
from app.modules.connections import models as connection_models  # noqa: E402,F401
