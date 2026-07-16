# apps/web

Standalone Next.js application for the legacy Risk Viewer frontend migration.

## Install

```bash
npm install --prefix apps/web
```

## Run

```bash
npm run dev --prefix apps/web
```

Default local URL: `http://127.0.0.1:3000`

## Auth Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and choose the values that match how you are running the web app and API.

Required variables:

- `API_BASE_URL`: server-side base URL used by Next.js auth/session validation calls.
- `NEXT_PUBLIC_API_BASE_URL`: optional browser-visible base URL used only when the login form talks directly to `apps/api` instead of the same-host proxy.
- `AUTH_SESSION_COOKIE_NAME`: backend-owned session cookie name. Keep this aligned with `apps/api`.
- `E2E_AUTH_USERNAME`: seeded internal-user username for Playwright auth setup.
- `E2E_AUTH_PASSWORD`: seeded internal-user password for Playwright auth setup.

### Same-host setup

- Set `API_BASE_URL` to the backend origin, for example `http://127.0.0.1:8000`.
- Leave `NEXT_PUBLIC_API_BASE_URL` unset so the browser uses the web app's same-host `/api/auth/*` proxy routes.
- Use this for the current local auth flow because `apps/api` does not yet expose CORS for credentialed browser requests.

### Split-origin local setup

- Point both `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` at the API origin, for example `http://127.0.0.1:8000`.
- Configure `apps/api` CORS to allow the explicit web origin and credentialed requests from `http://127.0.0.1:3000` before using this mode.
- Keep `AUTH_SESSION_COOKIE_NAME` aligned with the backend session-cookie setting.

### Auth test scaffolding

- `apps/web/tests/helpers/auth-session.ts` centralizes Playwright auth-session setup.
- The helper reads the auth env values, logs in through `POST /api/auth/login`, and can capture authenticated storage state for browser tests.

## Validation Commands

```bash
npm run test --prefix apps/web
npm exec --prefix apps/web playwright test -- --config apps/web/playwright.config.ts apps/web/tests/e2e/local-interactions.spec.ts apps/web/tests/e2e/accessibility.spec.ts apps/web/tests/e2e/routes.spec.ts apps/web/tests/e2e/navigation.spec.ts --grep-invert "@visual"
npm exec --prefix apps/web playwright test -- --config apps/web/playwright.config.ts apps/web/tests/visual/migrated-pages.spec.ts
npm run test:e2e:responsive --prefix apps/web
npm run test:visual:desktop --prefix apps/web
npm run test:visual:legacy --prefix apps/web
```

For backend-backed route/auth validation, run the Playwright commands with:

```bash
E2E_AUTH_WITH_BACKEND=1 API_BASE_URL=http://127.0.0.1:8000 AUTH_SESSION_COOKIE_NAME=rv_session
```

## Desktop Baseline Workflow

- `npm run test:visual:legacy --prefix apps/web` runs the explicit legacy desktop baseline capture flow via `apps/web/playwright.legacy.config.ts`.
- `npm run test:visual:desktop --prefix apps/web` runs the migrated desktop comparison suite.
- `npm run test:visual:repeatability --prefix apps/web` runs the desktop comparison suite twice in comparison-only mode.
- `npm run test:e2e:responsive --prefix apps/web` runs the responsive layout validation suite.

## Route Inventory

- `/`
- `/login`
- `/applications`
- `/services`
- `/creditmodeler-service`

## Notes

- The app owns its own routes, shell, styles, and migrated public assets.
- Approved desktop legacy baselines will live under `apps/web/tests/visual/baselines/legacy/`.
- Temporary Playwright artifacts belong under `apps/web/tests/visual/artifacts/` and are not approved baselines.
- Legacy generated pages under `frontend/` remain reference material only.
- Authentication remains backend-managed; the web app must not persist or inspect raw session-cookie values.

## Opencode sessions

ses_0b10cbcb4ffeszoB1vBSyOxixH
ses_0ae6307c4ffetTRllom99QgD3H
ses_09c2ad930ffe1RD11n26rpkTtx
