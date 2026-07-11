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

## Validation Commands

```bash
npm run test --prefix apps/web
npm run test:e2e --prefix apps/web
npm run test:e2e:responsive --prefix apps/web
npm run test:visual --prefix apps/web
npm run test:visual:desktop --prefix apps/web
npm run test:visual:legacy --prefix apps/web
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

## Opencode sessions

ses_0b10cbcb4ffeszoB1vBSyOxixH
ses_0ae6307c4ffetTRllom99QgD3H
