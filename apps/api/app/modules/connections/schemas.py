from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DatabaseOption(BaseModel):
    value: str
    label: str


class DatabaseOptionsResponse(BaseModel):
    databases: list[DatabaseOption]


class ConnectionCreateRequest(BaseModel):
    label: str
    driver: str
    database_path: str


class ConnectionUpdateRequest(BaseModel):
    driver: str
    database_path: str


class ConnectionTestRequest(BaseModel):
    driver: str
    database_path: str


class SavedConnection(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    driver: str
    database_path: str
    created_at: datetime
    updated_at: datetime
    last_tested_at: datetime | None = None


class SavedConnectionsResponse(BaseModel):
    connections: list[SavedConnection]


class ConnectionTestResult(BaseModel):
    ok: bool
    message: str


class SavedConnectionTestResult(ConnectionTestResult):
    connection: SavedConnection
