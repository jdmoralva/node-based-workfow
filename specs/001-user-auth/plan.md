# Implementation Plan: Internal User Login

**Branch**: `001-user-auth` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-user-auth/spec.md`

## Summary

Add a dedicated frontend login screen for internal users within the existing static dashboard shell, make it reachable from `frontend/index.html`, and wire the form to client-side required-field validation plus a frontend-only placeholder submit flow that explicitly avoids simulating a real authenticated session.

## Technical Context

**Language/Version**: Python 3 for the static page generator; HTML5, CSS3, and vanilla JavaScript for the generated frontend pages

**Primary Dependencies**: Existing dashboard shell generator under `frontend/scripts/`; shared stylesheet `frontend/style.css`; inline page bootstrap bundles assembled by `frontend/scripts/dashboard_shell_build/shell.py`

**Storage**: N/A for this feature; no credential, token, or session persistence is allowed in the frontend

**Testing**: `python -m unittest frontend.scripts.tests.test_build_dashboard_shell` plus direct generated-page verification through `python frontend/scripts/build_dashboard_shell.py`

**Target Platform**: Static browser pages opened directly from `file://` during local review

**Project Type**: Static frontend shell generated from JSON, partial templates, and small page-specific JavaScript bootstraps

**Performance Goals**: Login page should load with the same static-page responsiveness as the existing generated shell and present validation feedback immediately on submit or field correction

**Constraints**: Preserve existing visual style; keep changes frontend-only; do not add backend auth behavior; generated pages must continue to work from `file://`; any login JS must be compatible with the inline module bundling approach; the login page must not imply an authenticated state through shell affordances such as profile or logout controls

**Scale/Scope**: One new login page, one new page bootstrap flow if needed, one entry-point connection from `index.html`, and focused generator/style updates confined to the current `frontend/` shell

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The repository's `.specify/memory/constitution.md` is still an unfilled template with placeholder sections only.
- No enforceable project-specific constitutional rules are currently defined.
- Gate result before research: PASS by absence of active constitutional constraints.
- Gate result after Phase 1 design: PASS; the design remains scoped, minimal, and frontend-only.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── login-page.md
└── tasks.md
```

### Source Code (repository root)

```text
docs/
├── adr/
│   └── 0008-autenticacion-interna-usuario-contrasena.md
└── project/
    └── ISSUES.md

frontend/
├── assets/
│   └── js/
│       └── pages/
├── src/
│   └── dashboard_shell/
│       ├── pages.json
│       ├── entity-cards.json
│       ├── template.html
│       └── partials/
├── scripts/
│   ├── build_dashboard_shell.py
│   ├── tests/
│   │   └── test_build_dashboard_shell.py
│   └── dashboard_shell_build/
│       ├── context.py
│       ├── page_specs.py
│       └── shell.py
├── index.html
└── style.css
```

**Structure Decision**: Keep the feature inside the existing `frontend/` static shell instead of introducing a separate app surface. Source edits should stay in the generator inputs under `frontend/src/dashboard_shell/`, optional login-specific page JS under `frontend/assets/js/pages/`, and generator wiring under `frontend/scripts/dashboard_shell_build/`, followed by rebuilding generated `frontend/*.html` outputs.

## Phase 0: Research

Research outcomes are captured in [research.md](./research.md) and resolve the only design-sensitive choices for this feature:

- Keep `index.html` as the existing entry page and add a dedicated `login.html` reachable from it.
- Keep the login flow inside the shared shell rather than splitting the global template for a one-off pre-auth layout.
- Use frontend-only validation and a non-persistent placeholder result that does not navigate as an authenticated user.
- Treat `login.html` as an unauthenticated shell state so existing profile/logout affordances are hidden or neutralized on that page.

## Phase 1: Design & Contracts

- Define the login page entities and validation/result states in [data-model.md](./data-model.md).
- Capture the user-facing page contract in [contracts/login-page.md](./contracts/login-page.md).
- Document the build and verification path in [quickstart.md](./quickstart.md).
- Update the managed Spec Kit block in `AGENTS.md` to point at this plan file.

## Complexity Tracking

No constitutional violations or exceptional complexity require justification for this feature.
