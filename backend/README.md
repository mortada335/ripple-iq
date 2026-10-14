# RippleIQ — Backend Service

> **Framework:** FastAPI (Python 3.11+)  
> **ORM:** SQLAlchemy 2.0  
> **Validation:** Pydantic v2  
> **Migrations:** Alembic  
> **Simulation Engine:** Deterministic Mock Analyzer (`ai/mock_analyzer.py`)

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
| `GET` | `/api/v1/decisions/{id}` | Get decision by ID |
| `POST` | `/api/v1/decisions/{id}/context` | Attach institutional context data |
| `POST` | `/api/v1/decisions/{id}/simulate` | Run deterministic simulation |
| `GET` | `/api/v1/decisions/{id}/result` | Get full simulation result |
| `GET` | `/api/v1/decisions/{id}/report` | Get audit-ready Markdown report |

Interactive Swagger documentation is available at `/docs`.

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

   Set `DATABASE_URL` to your PostgreSQL connection string. SQLite is reserved
   for isolated tests. Set `ALLOWED_ORIGINS` to comma-separated trusted frontend origins; an
   empty value allows no cross-origin requests. Application logs use JSON lines,
   and unexpected server errors are logged without exposing exception details
   in API responses.

   For Neon, supply its PostgreSQL connection URI through the `DATABASE_URL`
   environment variable. The app uses the existing SQLAlchemy/psycopg2 stack;
   no JavaScript database client or frontend build step is involved. Do not add
   a real connection URI to tracked files. To move this backend to a local
   server in a VPC later, change the deployment's `DATABASE_URL` to the VPC
   PostgreSQL endpoint; the application code and Alembic migrations stay the
   same.

4. Start PostgreSQL (for example, `docker compose up -d db` from the repository
   root), then run migrations:
   ```bash
   alembic upgrade head
   ```

5. Start the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

6. Run tests:
   ```bash
   pytest -v
   ```
