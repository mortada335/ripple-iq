# RippleIQ — Backend Service

> **Framework:** FastAPI (Python 3.12+, verified on Python 3.13)
> **ORM:** SQLAlchemy 2.0  
> **Validation:** Pydantic v2  
> **Migrations:** Alembic  
> **Simulation Engine:** Deterministic mock by default; optional proxy/Gemini failover

---

## Architecture & Directory Layout

```text
backend/
├── app/
│   ├── api/             # REST endpoints (health, decisions, context, simulation, reports)
│   ├── models/          # SQLAlchemy relational database entities
│   ├── schemas/         # Pydantic v2 request/response schemas
│   ├── services/        # Business logic, simulation orchestration, markdown generator
│   ├── config.py        # Centralized settings loaded via Pydantic Settings
│   ├── database.py      # SQLAlchemy session factory and database engine
│   └── main.py          # FastAPI application factory and exception handlers
├── tests/               # Pytest automated test suite
├── alembic/             # Migration environment and version scripts
├── alembic.ini          # Alembic configuration
├── requirements.txt     # Runtime dependencies
├── requirements-dev.txt # Development and testing dependencies
├── .env.example         # Environment variables template
└── README.md            # This documentation file
```

---

## API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Root health check |
| `GET` | `/api/v1/health` | API v1 status, DB connectivity, analyzer mode |
| `POST` | `/api/v1/decisions` | Create decision |
| `GET` | `/api/v1/decisions` | List decisions scoped to an organization |
| `GET` | `/api/v1/decisions/{id}` | Get decision by ID |
| `PATCH` | `/api/v1/decisions/{id}` | Update decision fields |
| `DELETE` | `/api/v1/decisions/{id}` | Archive a decision |
| `POST` | `/api/v1/decisions/{id}/context` | Attach institutional context data |
| `GET/PATCH/DELETE` | `/api/v1/decisions/{id}/context`, `/api/v1/context/{context_id}` | Read and manage context |
| `POST` | `/api/v1/decisions/{id}/simulate` | Run deterministic simulation |
| `GET` | `/api/v1/decisions/{id}/analysis` | Get latest analysis status |
| `POST` | `/api/v1/decisions/{id}/analysis/retry` | Retry failed analysis |
| `GET` | `/api/v1/decisions/{id}/result` | Get full simulation result |
| `GET` | `/api/v1/scenarios/{scenario_id}` | Read a scenario and score components |
| `GET` | `/api/v1/decisions/{id}/recommendation` | Read original and current recommendation |
| `POST` | `/api/v1/decisions/{id}/refine` | Save human recommendation feedback |
| `GET` | `/api/v1/decisions/{id}/report` | Get audit-ready Markdown report |
| `GET` | `/api/v1/decisions/{id}/report.md` | Download Markdown report |
| `POST` | `/api/v1/auth/register` | Register with email, name, and password |
| `POST` | `/api/v1/auth/login` | Sign in and receive a bearer token |
| `GET` | `/api/v1/auth/me` | Get the authenticated account |
| `POST` | `/api/v1/organizations` | Create an organization as its owner |
| `GET` | `/api/v1/organizations` | List the current user's organizations |
| `GET` | `/api/v1/organizations/{organization_id}` | Get an organization and its members |
| `POST` | `/api/v1/organizations/{organization_id}/members` | Add a registered user with a role |

Interactive Swagger documentation is available at `/docs`.
The simulation result response includes non-secret provenance fields identifying
the provider/model, attempt count, fallback use, and whether a deterministic mock
was returned. This is an additive API field; no database schema change is needed.
Private API routes require `Authorization: Bearer <access_token>`. See
[`docs/security.md`](../docs/security.md) for role permissions and configuration.

---

## Running Locally

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\Activate.ps1 # Windows
   # source .venv/bin/activate # Unix
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. Setup environment file:
   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to your PostgreSQL connection string. SQLite is available
   only when explicitly configured for development and is used by isolated tests.
   The backend resolves `backend/.env` from its module path, regardless of the
   shell working directory. Set `ALLOWED_ORIGINS` to comma-separated trusted frontend
   origins; an empty value allows no cross-origin requests. Production requires
   a private `SECRET_KEY` of at least 32 characters and explicit CORS origins.
   Application logs use JSON lines; error responses omit stack traces and SQL
   details.

   To opt into hosted inference, configure `ANALYZER_BACKEND=multi_provider`,
   then supply the proxy key/model and newly rotated Gemini keys/model listed in
   `.env.example`. The confirmed proxy model list included `gpt-5.5` and
   `claude-fable-5`; `gpt-5.5` is the example selection. Google's current API
   example uses `gemini-3.8-flash`; verify model availability with your API
   project before production. Failover order is proxy, Gemini key 1, Gemini key
   2, then mock only when `LLM_DEGRADED_MODE_ENABLED=true`. Set degraded mode to
   false when policy requires an error instead of a mock result. See
   `docs/ai-provider-ocr.md` for provider and OCR details.

   For Neon, supply its PostgreSQL connection URI through `backend/.env` or the
   deployment environment's `DATABASE_URL` (include `sslmode=require`). The API
   health response reports the connected SQL dialect as `database_backend`.
   The app uses the existing SQLAlchemy/psycopg2 stack;
   no JavaScript database client or frontend build step is involved. Do not add
   a real connection URI to tracked files. To move this backend to a local
   server in a VPC later, change the deployment's `DATABASE_URL` to the VPC
   PostgreSQL endpoint; the application code and Alembic migrations stay the
   same.

4. Start PostgreSQL (for example, `docker compose up -d db` from the repository
   root), then run migrations from the `backend/` directory:
   ```bash
   alembic upgrade head
   ```

5. Start the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. Run backend and AI tests from `backend/`:
   ```bash
   python -m pytest tests ../ai/tests
   ```

   Run Ruff from the repository root:
   ```bash
   python -m ruff check backend ai
   python -m ruff format --check backend ai
   ```

Health checks are available at `http://localhost:8000/health` and
`http://localhost:8000/api/v1/health`; Swagger is at `http://localhost:8000/docs`.
