# Risk Viewer

Risk Viewer is a credit-risk analytics workbench for consumer portfolios. The product direction is documented in `docs/PRD.md` and `docs/SPEC.md`; the current implementation includes a FastAPI backend, a migrated Next.js frontend, backend-managed authentication, and the first CreditModeler workbench surface for managing SQLite database connections.

## Current Implementation

- `apps/api`: FastAPI backend with health checks, internal-user session authentication, SQLAlchemy/Alembic persistence, and per-user CreditModeler connection metadata endpoints.
- `apps/web`: Next.js App Router frontend with migrated shell/routes, backend-managed auth integration, protected routes, same-origin API proxy routes, visual/e2e coverage, and the CreditModeler Connections Builder.
- `frontend`: legacy generated dashboard shell and generator sources. Treat generated `frontend/*.html` as artifacts; edit generator sources instead.
- `agents`: prototype/reference code for text-to-SQL and RAG experiments.
- `docs`: product, technical, methodology, NFR, and ADR documentation.
- `specs`: Spec Kit feature plans and task breakdowns for implemented and planned work.
- `github`: reference material for MVP functionality, especially `github/orange3`.

There is no root package manifest, lockfile, or single repo-wide verification command. Run installs and validation per app area.

## Product Scope

The target MVP still centers on:

- Visual pipeline construction for credit-risk analysis.
- Dedicated delinquency-vintage and default-vintage analytics nodes.
- Dataset loading from CSV, Excel, and preloaded SQLite sources.
- Data inspection and explicit data-preparation steps.
- Traceable runs, basic result visualization, and PDF/PPTX export.
- AI chat modes for assistance, interpretation, and portfolio database questions.

The current executable implementation is earlier than the full MVP scope. The shipped workbench functionality currently focuses on application shell/auth and CreditModeler SQLite connection management.

## Applications

### API

See `apps/api/README.md` for full backend details.

Quick start:

```bash
python -m pip install -r apps/api/requirements.txt
python -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000
```

Seed a local internal user:

```bash
python apps/api/scripts/seed_internal_user.py --username analyst --password correct-horse-battery-staple
```

Main implemented API areas:

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/protected-check`
- `GET|POST /api/connections`
- `GET|PUT|DELETE /api/connections/{connection_id}`
- `GET /api/connections/databases`
- `POST /api/connections/test`
- `POST /api/connections/{connection_id}/test`

### Web

See `apps/web/README.md` for full frontend details.

Quick start:

```bash
npm install --prefix apps/web
npm run dev --prefix apps/web
```

Default local URL: `http://127.0.0.1:3000`.

Implemented routes:

- `/`
- `/login`
- `/applications`
- `/services`
- `/creditmodeler-service`

The protected web routes depend on the backend-owned session cookie. For local backend-backed flows, run `apps/api` and set `API_BASE_URL=http://127.0.0.1:8000` for the web app.

### Audit

Review running process

```bash
$api = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
$web = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
@($api, $web) | Where-Object { $_ } | Select-Object LocalAddress,LocalPort,OwningProcess
```

## Configuration

Backend environment values are documented in `apps/api/.env.example`. Important settings include:

- `APP_DATABASE_URL`
- `APP_DATASETS_ROOT`
- `APP_AUTO_CREATE_TABLES`
- `APP_SESSION_COOKIE_NAME`
- `APP_SESSION_COOKIE_SECURE`
- `APP_SESSION_COOKIE_SAMESITE`
- `APP_SESSION_COOKIE_MAX_AGE_SECONDS`

Frontend environment values are documented in `apps/web/.env.example`. Important settings include:

- `API_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `AUTH_SESSION_COOKIE_NAME`
- `E2E_AUTH_USERNAME`
- `E2E_AUTH_PASSWORD`

For the default same-origin browser flow, leave `NEXT_PUBLIC_API_BASE_URL` unset and let the Next.js `/api/auth/*` and `/api/connections/*` route handlers proxy to `apps/api` through `API_BASE_URL`.

## Verification

API tests from `apps/api`:

```bash
python -m pytest
```

Web unit/lint checks from the repo root:

```bash
npm run test --prefix apps/web
npm run lint --prefix apps/web
```

Focused web connections coverage:

```bash
npm run test --prefix apps/web -- tests/unit/connection-builder.test.tsx tests/unit/connections-proxy.test.ts tests/unit/workbench-tree.test.tsx
```

Web Playwright checks:

```bash
npm run test:e2e --prefix apps/web
npm run test:e2e:responsive --prefix apps/web
npm run test:visual:desktop --prefix apps/web
```

Legacy shell generator checks:

```bash
python -m unittest frontend.scripts.tests.test_build_dashboard_shell
python frontend/scripts/build_dashboard_shell.py
```

## Source Of Truth

- `docs/PRD.md`: product requirements.
- `docs/SPEC.md`: implementation specification and technical direction.
- `docs/METHODOLOGY.md`: crop-vintage calculation rules.
- `docs/adr/`: architecture decisions.
- `specs/007-connections-builder/`: current implemented Connections Builder feature plan.

When documents disagree with executable code, use `docs/SPEC.md` and the app-specific READMEs as the starting point, then verify against the implementation.
