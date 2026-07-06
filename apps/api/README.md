# Risk Viewer API

## Purpose

`apps/api` contains the FastAPI backend foundation for the Risk Viewer MVP.

## Install

```bash
python -m pip install -r apps/api/requirements.txt
```

## Configuration

Copy `apps/api/.env.example` values into your local environment or root `.env` file as needed.

Key settings:

- `APP_DATABASE_URL`
- `APP_SESSION_COOKIE_NAME`
- `APP_SESSION_COOKIE_SECURE`
- `APP_SESSION_COOKIE_MAX_AGE_SECONDS`

Local development defaults `APP_SESSION_COOKIE_SECURE` to `false` when `APP_ENV` is `development`, `dev`, or `local`. Set it explicitly to `true` for HTTPS environments.

## Run locally

```bash
python -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000
```

## Run tests

```bash
python -m pytest apps/api/tests
```

## Seed an internal user

```bash
python apps/api/scripts/seed_internal_user.py --username analyst --password correct-horse-battery-staple
```

## Available endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/protected-check`

## Tests

Then test login:

```bash
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" `
  -Method POST `
  -WebSession $session `
  -ContentType "application/json" `
  -Body '{"username":"analyst","password":"correct-horse-battery-staple"}'
```

Check current user:

```bash
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/me" -WebSession $session
```

Logout:

```bash
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/logout" -Method POST -WebSession $session
```
