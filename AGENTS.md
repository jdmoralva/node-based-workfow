# AGENTS

## Source Of Truth
- Product scope lives in `docs/PRD.md`; implementation decisions live in `docs/SPEC.md`; crop-vintage calculation rules live in `docs/METHODOLOGY.md`.
- Treat anything under `github/` as reference material for MVP functionality, especially `github/orange3`.
- `README.md` is only a summary; trust `docs/SPEC.md` when product docs disagree with repo state.

## Repo Shape
- `apps/web` and `apps/api` from `docs/SPEC.md` still do not exist.
- The runnable code today is split between `frontend/` and `agents/`.
- There is still no root manifest, lockfile, or CI workflow; verification is per-area.

## Frontend Shell
- `frontend/*.html` are generated artifacts. Edit the sources under `frontend/src/dashboard_shell/` and `frontend/assets/js/`, then rebuild; do not hand-edit generated pages.
- Rebuild with `python frontend/scripts/build_dashboard_shell.py` from the repo root.
- Focused verification for shell changes is `python -m unittest frontend.scripts.tests.test_build_dashboard_shell`.
- The generator writes directly to `frontend/{page}.html`; if you change page names, bootstrap keys, or tree menu keys, rebuild and inspect the generated HTML.
- `frontend/scripts/dashboard_shell_build/context.py` supports `DASHBOARD_SHELL_ENTITY_CARDS_FILE` to swap the entity-card JSON source during tests or fixture-driven edits.
- The generated pages are meant to work from `file://`, so `frontend/scripts/dashboard_shell_build/shell.py` intentionally inlines module code instead of loading external module scripts.
- `frontend/README.md` has a stale reference to `creditcard-service-page.js`; the current service bootstrap source is `frontend/assets/js/pages/creditmodeler-service-page.js`.

## Prototype Commands
- Run Python from `agents/` unless you set `PYTHONPATH=agents`; both prototypes import `text2sql.*` / `rag.*` as top-level packages.
- `python text2sql/main.py` from `agents/` runs the text-to-SQL prototype. It instantiates the LLM/session and executes a hard-coded Spanish question at import time.
- `python rag/services/vector_store.py` from `agents/` rebuilds Chroma from PDFs in `rag/data/knowledge/` into `rag/data/chroma/`.
- `agents/rag/main.py` is not a complete runnable app entrypoint; it builds retrievers and currently wires `ChatGoogleGenerativeAI` with `OPENAI_MODEL`, so inspect before assuming model behavior.

## Data And Env
- Both prototypes call `load_dotenv()`, so they expect a repo-root `.env` when run from `agents/`.
- `agents/text2sql/services/config.py` defaults `DATABASE_URL` to `sqlite:///text2sql/data/Chinook.db`; this is sample data, not the MVP portfolio database.
- Avoid churn in local/generated artifacts: `.env`, `agents/rag/data/chroma/`, `agents/rag/data/knowledge/`, `agents/text2sql/data/Chinook.db`, generated `frontend/*.html`, and any `__pycache__/` contents.

## Verification
- There is no single repo-wide verification command.
- For `frontend/` changes, run `python -m unittest frontend.scripts.tests.test_build_dashboard_shell` and `python frontend/scripts/build_dashboard_shell.py`.
- For `agents/` changes, prefer the narrowest prototype script for the area touched rather than broad exploratory runs.
- For `docs/` changes, verify consistency against `docs/SPEC.md`, `docs/PRD.md`, and the executable sources you touched.

## Speckit
Configuration files exists in `C:\Users\User\Documents\1. Projects\24. Risk Viewer\.specify`

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/006-frontend-auth-integration/plan.md
<!-- SPECKIT END -->
