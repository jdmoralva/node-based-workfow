from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    username: str
    password: str


class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str


class AuthStatusResponse(BaseModel):
    authenticated: bool
    username: str


class MessageResponse(BaseModel):
    detail: str
