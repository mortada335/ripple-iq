# Backend and AI Verification

## Test environment

The API tests use a dedicated in-memory SQLite engine and rebuild its schema
between test functions. Tests do not connect to Neon or use production
credentials. The deterministic mock provider requires no network access or API
key.

Create the backend environment and install development dependencies from
`backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt -r requirements-dev.txt
```

## Complete commands

Run from the repository root after activating the backend environment:

```powershell
python -m pytest backend/tests ai/tests
python -m ruff check backend ai
python -m ruff format --check backend ai
git diff --check
git diff --name-only -- frontend/ apps/frontend/
```

Expected API and analyzer tests use only isolated SQLite data. The end-to-end
test covers account registration, login, organization creation, decision and
context creation, simulation, persisted result retrieval, and Markdown export.

## Migration verification

For a clean local migration check, set `DATABASE_URL` to a disposable empty
PostgreSQL database, then run from `backend/`:

```powershell
python -m alembic upgrade head
python -m alembic check
```

Never use a production database for tests that insert or delete fixture data.
Neon connectivity and applied Alembic heads are recorded in
[`backend-progress.md`](backend-progress.md); CI tests themselves do not write
to that database.
