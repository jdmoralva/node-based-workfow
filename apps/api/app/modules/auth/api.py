from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.database import get_db_session
from app.core.session import clear_session_cookie, set_session_cookie
from app.modules.auth.schemas import AuthStatusResponse, CurrentUserResponse, LoginRequest, MessageResponse
from app.modules.auth.service import authenticate_user, create_session_for_user, require_current_user, revoke_session_if_present

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=CurrentUserResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
) -> CurrentUserResponse:
    user = authenticate_user(db, payload.username, payload.password)
    _session_record, raw_token = create_session_for_user(db, user)
    set_session_cookie(response, raw_token, settings)
    return CurrentUserResponse.model_validate(user)


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db_session),
    settings: Settings = Depends(get_settings),
    current_user: CurrentUserResponse | None = None,
) -> MessageResponse:
    del current_user
    revoke_session_if_present(db, request.cookies.get(settings.session_cookie_name))
    clear_session_cookie(response, settings)
    return MessageResponse(detail="Signed out")


@router.get("/me", response_model=CurrentUserResponse)
def current_user(user=Depends(require_current_user)) -> CurrentUserResponse:
    return CurrentUserResponse.model_validate(user)


@router.get("/protected-check", response_model=AuthStatusResponse)
def protected_check(user=Depends(require_current_user)) -> AuthStatusResponse:
    return AuthStatusResponse(authenticated=True, username=user.username)
