# Implementation Plan: Frontend Authentication Integration

**Branch**: `[006-frontend-auth-integration]` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-frontend-auth-integration/spec.md`

## Summary

Connect the existing `apps/web` login experience to the already available `apps/api` session-authentication backend, make `/login` the true application entry point, and add layered route protection for `/applications`, `/services`, and `/creditmodeler-service` without changing the approved frontend visual design. The implementation will replace the current frontend-only placeholder submit path with backend-backed sign-in, centralize frontend auth/session checks, preserve safe intended-route restoration, and add unit, end-to-end, and visual-regression coverage for the new auth flow.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js for `apps/web`; Python 3.11 backend already present in `apps/api`

**Primary Dependencies**: Next.js 15 App Router, React 18, existing shared shell/components in `apps/web`, FastAPI auth endpoints in `apps/api`, Vitest, Playwright

**Storage**: Backend-managed session storage and cookies owned by `apps/api`; no frontend-managed persistent auth storage

**Testing**: Vitest for unit coverage in `apps/web`; Playwright for end-to-end route/auth/visual checks; existing pytest backend coverage remains the backend contract safety net

**Target Platform**: Same-host web deployment for MVP plus split-origin local development at `apps/web` and `apps/api`

**Project Type**: Web application with a separately deployed backend API

**Performance Goals**: Sign-in, session validation, and protected-route checks must complete before protected content is rendered for unauthenticated requests and before the login panel is shown to authenticated `/login` visitors; automated route and visual checks must verify zero protected-content flash and zero authenticated-login flash during those auth decisions

**Constraints**: Preserve the current login DOM, CSS classes, geometry, and idle-state visual output; fail closed when auth cannot be confirmed; keep the backend as the sole owner of session credentials; protect future app routes by default unless explicitly public; support both split-origin development and same-host deployment

**Scale/Scope**: One existing Next.js app, one existing FastAPI app, three initially protected routes, one login form, one logout integration path, and focused auth-related updates to route handling, frontend session utilities, and automated tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The repository constitution file is still an unfilled template with placeholder sections only.
- No enforceable project-specific constitutional rules are currently defined.
- Gate result before research: PASS by absence of active constitutional constraints.
- Gate result after Phase 1 design: PASS; the plan remains minimal, keeps backend/frontend boundaries intact, and aligns with `docs/SPEC.md` plus the active feature spec.

## Project Structure

### Documentation (this feature)

```text
specs/006-frontend-auth-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── web-auth-session-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   └── modules/
│   │       └── auth/
│   └── tests/
│       ├── contract/
│       └── integration/
└── web/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── login/
    │   │   └── page.tsx
    │   └── (protected)/
    │       ├── layout.tsx
    │       ├── applications/
    │       │   └── page.tsx
    │       ├── services/
    │       │   └── page.tsx
    │       └── creditmodeler-service/
    │           └── page.tsx
    ├── components/
    │   └── shell/
    ├── config/
    ├── features/
    │   └── login/
    │       └── LoginForm.tsx
    ├── lib/
    │   └── auth/
    ├── tests/
    │   ├── unit/
    │   ├── e2e/
    │   └── visual/
    └── middleware.ts
```

**Structure Decision**: Keep the feature inside the existing `apps/web` and `apps/api` applications. Add a small auth utility layer under `apps/web/lib/auth`, centralize protected-route validation at the app-routing boundary plus middleware, express protected pages through an `apps/web/app/(protected)/` route group with a shared layout, and keep login-form UI changes isolated to `apps/web/features/login/LoginForm.tsx` so the current shell and styling remain intact.

## Phase 0: Research

Research outcomes are captured in [research.md](./research.md) and resolve the technical decisions required before implementation:

- Use a frontend-owned auth service split between browser-side sign-in/sign-out helpers and server-side session validation helpers.
- Move route protection to layered routing controls: root redirect, middleware early rejection, and authoritative server-side session validation before rendering protected content.
- Treat `/api/auth/me` as the source of truth for authenticated state after login and during protected-route checks.
- Validate intended destinations against an explicit internal-route allowlist and fall back to `/applications` for anything unsafe.
- Keep visual non-regression by preserving the existing login component structure and using only state/behavior changes inside the current containers.
- Verify the feature with unit, Playwright route/auth, and idle-state visual checks in `apps/web`, while relying on existing `apps/api` tests for backend contract stability.

## Phase 1: Design & Contracts

- Define frontend-visible auth entities, session states, redirect-target rules, and route-access decisions in [data-model.md](./data-model.md).
- Document the web-to-API authentication and protected-route contract in [contracts/web-auth-session-contract.md](./contracts/web-auth-session-contract.md).
- Capture the end-to-end validation flow for split-origin local development and same-host assumptions in [quickstart.md](./quickstart.md).
- Update the managed Spec Kit block in `AGENTS.md` to point at this plan file.

## Complexity Tracking

No constitutional violations or exceptional complexity require justification for this feature.
