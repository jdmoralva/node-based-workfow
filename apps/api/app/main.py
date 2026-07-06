from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.database import create_all_tables, initialize_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings: Settings = app.state.settings
    initialize_database(settings)
    if settings.auto_create_tables:
        create_all_tables()
    yield


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings or get_settings()
    app = FastAPI(title=active_settings.app_name, lifespan=lifespan)
    app.state.settings = active_settings
    app.include_router(api_router)
    return app


app = create_app()
