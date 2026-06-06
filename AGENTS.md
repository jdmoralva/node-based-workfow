# AGENTS

## Repo Shape
- Product docs live in `docs/` (`docs/PRD.md` and `docs/SPEC.md`); `README.md` is only an executive summary.
- The only code in the repo is under `agents/`: `agents/text2sql/` and `agents/rag/` are standalone prototypes/reference implementations.
- There is no root manifest, lockfile, CI workflow, or repo-defined test/lint/typecheck config.

## Working Directory
- Run Python from `agents/` unless you explicitly set `PYTHONPATH=agents`. Both prototypes import `text2sql.*` / `rag.*` as top-level packages and rely on relative paths.
- Both `agents/text2sql/main.py` and `agents/rag/main.py` call `load_dotenv()`, so they expect a repo-root `.env` to exist when run from `agents/`.

## text2sql Prototype
- Entrypoint: `agents/text2sql/main.py`.
- Run from `agents/` with `python text2sql/main.py`.
- Default DB is `sqlite:///text2sql/data/Chinook.db` from `agents/text2sql/services/config.py`.
- `main.py` is script-style: it instantiates the LLM/session at import time, runs a hard-coded Spanish question, and prints SQL plus the execution result.
- Default live model is `ChatOpenAI(model="gpt-5.4-mini")`; Ollama and Gemini alternatives are present but commented out.

## rag Prototype
- Entrypoint: `agents/rag/main.py`.
- Vector-store rebuild script: `agents/rag/services/vector_store.py`.
- Run from `agents/` with `python rag/services/vector_store.py` to rebuild/update Chroma from PDFs in `rag/data/knowledge/` into `rag/data/chroma/`.
- `agents/rag/main.py` expects the Chroma store to already exist.
- `agents/rag/main.py` currently wires `ChatGoogleGenerativeAI` with `OPENAI_MODEL`; treat model selection there as code to inspect, not assumed-correct behavior.

## Verification
- There is no repo-defined automated verification.
- Safest validation is focused script execution from `agents/` for the area you changed.

## Change Hygiene
- Avoid churn in generated/local data: `.env`, `agents/rag/data/chroma/`, `agents/rag/data/knowledge/`, `agents/text2sql/data/Chinook.db`, and any `__pycache__/` contents.
