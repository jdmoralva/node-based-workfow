# Risk Viewer API

FastAPI backend for the Risk Viewer MVP. The app currently provides health checks, internal-user session authentication, and persisted CreditModeler database connection metadata.

## Implementation

- `app/main.py` creates the FastAPI app, initializes the configured database on startup, and mounts all routes under `/api`.
- `app/api/router.py` composes the health, auth, and connections routers.
- `app/core/config.py` loads `APP_*` settings from the environment or a repo-root `.env`.
- `app/core/database.py` owns SQLAlchemy engine/session setup.
- `app/core/session.py` and `app/core/security.py` own session-cookie and password hashing behavior.
- `app/modules/auth` stores internal users and session records, then exposes login/logout/current-user routes.
- `app/modules/connections` stores per-user SQLite connection metadata and validates references against the configured datasets root.
- `alembic/versions` contains schema migrations for auth and database connections.

## Install

```bash
python -m pip install -r apps/api/requirements.txt
```

## Configuration

Copy `apps/api/.env.example` values into your local environment or repo-root `.env` as needed.

Key settings:

- `APP_NAME`: FastAPI application title.
- `APP_ENV`: environment name. `development`, `dev`, and `local` default session cookies to non-secure unless overridden.
- `APP_DATABASE_URL`: SQLAlchemy database URL. The local default is `sqlite:///./data/app/app.db` relative to the repo root.
- `APP_DATASETS_ROOT`: directory used when discovering and validating SQLite dataset files. The default is `data/datasets` relative to the repo root.
- `APP_AUTO_CREATE_TABLES`: when true, creates tables on startup from SQLAlchemy metadata.
- `APP_SESSION_COOKIE_NAME`: backend-owned session cookie name. Keep aligned with `apps/web` `AUTH_SESSION_COOKIE_NAME`.
- `APP_SESSION_COOKIE_SECURE`: optional explicit secure-cookie flag. Leave unset for local HTTP development.
- `APP_SESSION_COOKIE_SAMESITE`: cookie SameSite policy. Default is `lax`.
- `APP_SESSION_COOKIE_MAX_AGE_SECONDS`: session-cookie lifetime in seconds.

## Run Locally

```bash
python -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000
```

## Database

The app can create tables automatically during local startup when `APP_AUTO_CREATE_TABLES=true`. Alembic migrations are also present for explicit schema management:

```bash
python -m alembic -c apps/api/alembic.ini upgrade head
```

## Seed An Internal User

```bash
python apps/api/scripts/seed_internal_user.py --username analyst --password correct-horse-battery-staple
```

## Endpoints

Health:

- `GET /api/health`

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/protected-check`

Connections, all requiring an authenticated session:

- `GET /api/connections/databases`: discover available SQLite database options under `APP_DATASETS_ROOT`.
- `GET /api/connections`: list the current user's saved connections.
- `POST /api/connections`: create a saved connection. Only the `sqlite` driver is supported.
- `GET /api/connections/{connection_id}`: read one owned saved connection.
- `PUT /api/connections/{connection_id}`: update one owned connection's driver/database reference.
- `DELETE /api/connections/{connection_id}`: delete one owned connection metadata record.
- `POST /api/connections/{connection_id}/test`: test an owned saved connection and update `last_tested_at`.
- `POST /api/connections/test`: test an unsaved SQLite database reference.

## Auth Smoke Test

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" `
  -Method POST `
  -WebSession $session `
  -ContentType "application/json" `
  -Body '{"username":"analyst","password":"correct-horse-battery-staple"}'

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/me" -WebSession $session

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/logout" -Method POST -WebSession $session
```

## Tests

From `apps/api`:

```bash
python -m pytest
```

Focused suites:

```bash
python -m pytest tests/contract/test_connections_api.py
python -m pytest tests/integration/test_connections_flow.py
python -m pytest tests/integration/test_auth_session_flow.py
```

## Opencode sessions

ses_092b2c61effexbLMPlgg48oKhs
ses_089c204cfffefhAhgs2Ff12k4h
