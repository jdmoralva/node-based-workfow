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
npm run test:visual --prefix apps/web
```

## Route Inventory

- `/`
- `/login`
- `/applications`
- `/services`
- `/creditmodeler-service`

## Notes

- The app owns its own routes, shell, styles, and migrated public assets.
- Visual regression baselines are stored under `apps/web/tests/visual/__screenshots__/`.
- Legacy generated pages under `frontend/` remain reference material only.

## Opencode sessions

ses_0b10cbcb4ffeszoB1vBSyOxixH
