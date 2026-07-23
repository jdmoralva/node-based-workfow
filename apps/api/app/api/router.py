from fastapi import APIRouter

from app.modules.auth.api import router as auth_router
from app.modules.connections.api import router as connections_router
from app.modules.data_models.api import router as data_models_router
from app.modules.health.api import router as health_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(connections_router)
api_router.include_router(data_models_router)
