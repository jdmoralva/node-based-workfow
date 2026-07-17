# Risk Viewer Web

Standalone Next.js application for the migrated Risk Viewer frontend. The current app includes the public landing/login routes, protected application/service routes, and the CreditModeler workbench with persisted database connection management.

## Implementation

- `app/` contains Next.js App Router pages and same-origin API proxy routes.
- `app/(protected)/` contains routes guarded by `middleware.ts` through the backend-owned session cookie.
- `components/shell` contains the migrated application shell, top bar, sidebar, breadcrumbs, toolbar, and page header components.
- `components/workbench` contains the reusable workbench layout, object tree, stage bar, and canvas panel.
- `features/login` contains the login form.
- `features/creditmodeler` contains the CreditModeler workbench and Connections Builder client/state code.
- `lib/auth` contains browser and server auth helpers.
- `config/` contains routes, navigation/card data, breadcrumbs, and workbench tree-menu configuration.
- `tests/unit`, `tests/e2e`, and `tests/visual` contain Vitest, Playwright interaction, and visual/layout coverage.

## Install

```bash
npm install --prefix apps/web
```

## Run Locally

```bash
npm run dev --prefix apps/web
```

Default local URL: `http://127.0.0.1:3000`.

For backend-backed auth and connections, run `apps/api` on `http://127.0.0.1:8000` and set `API_BASE_URL` accordingly.

## Routes

Public routes:

- `/`
- `/login`

Protected routes:

- `/applications`
- `/services`
- `/creditmodeler-service`

Same-origin API proxy routes:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `/api/connections/*`

## Auth And API Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and choose values that match how you run the web app and API.

Variables:

- `API_BASE_URL`: server-side API origin used by Next.js proxy routes. Defaults to `http://127.0.0.1:8000` in the connections proxy when unset.
- `NEXT_PUBLIC_API_BASE_URL`: optional browser-visible API origin. Leave unset to use same-origin `/api/*` proxy routes.
- `AUTH_SESSION_COOKIE_NAME`: backend-owned session cookie name. Keep aligned with `apps/api` `APP_SESSION_COOKIE_NAME`.
- `E2E_AUTH_USERNAME`: seeded internal-user username for backend-backed Playwright auth setup.
- `E2E_AUTH_PASSWORD`: seeded internal-user password for backend-backed Playwright auth setup.

### Same-Origin Browser Flow

- Set `API_BASE_URL` to the backend origin, for example `http://127.0.0.1:8000`.
- Leave `NEXT_PUBLIC_API_BASE_URL` unset so browser requests use `/api/auth/*` and `/api/connections/*` on the web origin.
- Next.js route handlers forward those requests to `apps/api` and preserve session cookies.

### Split-Origin Browser Flow

- Set both `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to the backend origin, for example `http://127.0.0.1:8000`.
- Use this only when `apps/api` is configured to allow credentialed CORS from the web origin.

## CreditModeler Connections Builder

The `/creditmodeler-service` route hosts the current workbench implementation. Selecting `Connections` in the object tree opens a new database connection builder.

Implemented behavior:

- Loads available SQLite databases from `GET /api/connections/databases`.
- Lists saved connections under the `Connections` tree node from `GET /api/connections`.
- Tests unsaved connections through `POST /api/connections/test`.
- Saves new connections through `POST /api/connections`.
- Opens saved connections from the tree through `GET /api/connections/{connection_id}`.
- Tests saved connections through `POST /api/connections/{connection_id}/test`.
- Updates saved connection database references through `PUT /api/connections/{connection_id}`.
- Drops saved connection metadata through `DELETE /api/connections/{connection_id}` with confirmation UI.
- Refreshes the tree after save/update/drop and resets the new-connection builder when `Connections` is selected again.

## Scripts

From `apps/web`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
npm run test
npm run test:watch
npm run test:e2e
npm run test:e2e:responsive
npm run test:visual
npm run test:visual:desktop
npm run test:visual:repeatability
npm run test:visual:legacy
```

From the repo root, use `--prefix apps/web`, for example:

```bash
npm run test --prefix apps/web
```

## Backend-Backed Playwright Runs

Some Playwright checks are skipped unless a backend is running and seeded. Enable them with:

```bash
E2E_AUTH_WITH_BACKEND=1 API_BASE_URL=http://127.0.0.1:8000 AUTH_SESSION_COOKIE_NAME=rv_session
```

On Windows PowerShell:

```powershell
$env:E2E_AUTH_WITH_BACKEND = "1"
$env:API_BASE_URL = "http://127.0.0.1:8000"
$env:AUTH_SESSION_COOKIE_NAME = "rv_session"
```

## Validation

Common focused commands:

```bash
npm run test --prefix apps/web
npm run lint --prefix apps/web
npm run test:e2e --prefix apps/web
npm run test:visual:desktop --prefix apps/web
```

Connections-focused unit coverage:

```bash
npm run test --prefix apps/web -- tests/unit/connection-builder.test.tsx tests/unit/connections-proxy.test.ts tests/unit/workbench-tree.test.tsx
```

## Visual Baseline Workflow

- `npm run test:visual:legacy --prefix apps/web` runs the explicit legacy desktop baseline capture flow via `apps/web/playwright.legacy.config.ts`.
- `npm run test:visual:desktop --prefix apps/web` runs the migrated desktop comparison suite.
- `npm run test:visual:repeatability --prefix apps/web` runs the desktop comparison suite twice in comparison-only mode.
- `npm run test:e2e:responsive --prefix apps/web` runs the responsive layout validation suite.

## Notes

- The app owns its routes, shell, styles, and migrated public assets.
- Legacy generated pages under `frontend/` remain reference material only.
- Approved legacy visual baselines live under `apps/web/tests/visual/**/snapshots` and related visual baseline directories.
- Temporary Playwright artifacts belong under `apps/web/tests/visual/artifacts/` and are not approved baselines.
- Authentication remains backend-managed; the web app must not persist or inspect raw session-cookie values.

## Opencode sessions

ses_0b10cbcb4ffeszoB1vBSyOxixH
ses_0ae6307c4ffetTRllom99QgD3H
ses_09c2ad930ffe1RD11n26rpkTtx
