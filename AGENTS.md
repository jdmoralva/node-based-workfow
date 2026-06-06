# AGENTS

## Source Of Truth
- `docs/PRD.md` defines product scope; `docs/SPEC.md` defines the MVP implementation target.
- `README.md` is only a summary.
- Treat anything under `github/` as reference material for MVP functionality.

## Repo Shape
- There is no root manifest, lockfile, CI workflow, or repo-defined test/lint/typecheck config.
- The only runnable code is under `agents/`:
  - `agents/text2sql/` is a standalone text-to-SQL prototype.
  - `agents/rag/` is a standalone RAG prototype.

## Working Notes
- Run Python from `agents/` unless you set `PYTHONPATH=agents`; both prototypes import `text2sql.*` / `rag.*` as top-level packages.
- Both entrypoints call `load_dotenv()`, so they expect a repo-root `.env` when run from `agents/`.
- Avoid churn in generated/local data: `.env`, `agents/rag/data/chroma/`, `agents/rag/data/knowledge/`, `agents/text2sql/data/Chinook.db`, and any `__pycache__/` contents.

## Prototype Commands
- `python text2sql/main.py` from `agents/` runs the text-to-SQL demo. It creates the LLM/session at import time, uses `sqlite:///text2sql/data/Chinook.db` by default, and prints the generated SQL plus execution result.
- `python rag/services/vector_store.py` from `agents/` rebuilds Chroma from PDFs in `rag/data/knowledge/` into `rag/data/chroma/`.
- `python rag/main.py` from `agents/` assumes the Chroma store already exists. `agents/rag/main.py` currently wires `ChatGoogleGenerativeAI` with `OPENAI_MODEL`, so inspect that file before changing model selection.

## Verification
- There is no repo-defined automated verification.
- Prefer focused script execution from `agents/` for the area you changed.
