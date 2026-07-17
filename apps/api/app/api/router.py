from fastapi import APIRouter

from app.modules.auth.api import router as auth_router
from app.modules.connections.api import router as connections_router
from app.modules.health.api import router as health_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(connections_router)
