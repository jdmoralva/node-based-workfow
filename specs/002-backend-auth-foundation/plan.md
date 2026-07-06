# Implementation Plan: Backend Authentication Foundation

**Branch**: `[002-backend-auth-foundation]` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-backend-auth-foundation/spec.md`

## Summary

Establish the first production backend under `apps/api` as a single FastAPI-based modular monolith with a minimal but complete authentication foundation for internal users. The work will create the application shell, configuration and persistence boundaries, health and auth routes, backend-managed session handling, and a reusable protected-route dependency while keeping `apps/web` and `apps/api` as independent applications for same-host MVP deployment.

## Technical Context

**Language/Version**: Python 3.11

**Primary Dependencies**: FastAPI, ASGI server for local runtime, SQLAlchemy ORM, Alembic for schema migration management, Pydantic settings, Argon2 password hashing library, pytest

**Storage**: SQLite application database for internal users and authenticated sessions; local filesystem configuration under the repo; future portfolio SQLite remains separate from this feature

**Testing**: pytest for unit, integration, and API contract verification around startup, health, auth, and session protection

**Target Platform**: Same-host Linux or developer workstation runtime for MVP backend service

**Project Type**: Web service

**Performance Goals**: Health and authentication endpoints respond consistently for internal pilot use, with interactive sign-in and session checks completing within normal web-app expectations for a small internal audience

**Constraints**: Keep `apps/api` independent from `apps/web`; single backend process for MVP; backend-managed secure HTTP-only cookie sessions; no plaintext password storage; no RBAC requirement; no unnecessary microservice or event-driven complexity

**Scale/Scope**: One new backend application, one internal auth module, one health module, one application SQLite store, and focused tests sufficient for a single pilot area and future extension of additional protected API modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The repository constitution file is still an unfilled template with placeholder sections only.
- No enforceable project-specific constitutional rules are currently defined.
- Gate result before research: PASS by absence of active constitutional constraints.
- Gate result after Phase 1 design: PASS; the design remains minimal, modular, and aligned with ADR-001, ADR-002, and ADR-008.

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-auth-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-health-api.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
└── api/
    ├── app/
    │   ├── main.py
    │   ├── core/
    │   │   ├── config.py
    │   │   ├── database.py
    │   │   ├── security.py
    │   │   └── session.py
    │   ├── api/
    │   │   └── router.py
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── api.py
    │   │   │   ├── models.py
    │   │   │   ├── repository.py
    │   │   │   ├── schemas.py
    │   │   │   └── service.py
    │   │   └── health/
    │   │       └── api.py
    │   └── db/
    │       └── base.py
    └── tests/
        ├── contract/
        ├── integration/
        └── unit/

data/
└── app/
```

**Structure Decision**: Introduce `apps/api` as a self-contained backend application organized by domain-first modules under `app/modules/` with a thin shared `core/` layer for configuration, persistence, and security concerns. This keeps auth as a bounded domain module, leaves room for future modules such as datasets or pipelines, and preserves separation from the existing frontend code under `frontend/`; creating `apps/web` is outside the scope of this feature.

## Phase 0: Research

Research outcomes are captured in [research.md](./research.md) and resolve the technical decisions required before implementation:

- Use a domain-first modular-monolith structure inside `apps/api` rather than a flat layer-only layout.
- Use a small app-factory style entrypoint with a stable `/api` route prefix and an always-on health endpoint.
- Use a typed backend configuration layer that centralizes environment-driven settings.
- Use a dedicated SQLite application database for internal users and backend-managed sessions, separate from any future portfolio database.
- Use Argon2 password hashing, server-side session records, a secure HTTP-only cookie, and a central protected-route dependency for MVP authentication.

## Phase 1: Design & Contracts

- Define the internal user, authenticated session, and protected-access validation entities in [data-model.md](./data-model.md).
- Document the initial backend HTTP contract for health, login, logout, current-user, and protected-session validation in [contracts/auth-health-api.md](./contracts/auth-health-api.md).
- Capture the validation and local run flow in [quickstart.md](./quickstart.md).
- Update the managed Spec Kit block in `AGENTS.md` to point at this plan file.

## Complexity Tracking

No constitutional violations or exceptional complexity require justification for this feature.
