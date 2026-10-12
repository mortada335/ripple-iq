# RippleIQ — Local Setup & Development Guide

> **Document Version:** 1.0.0 (MVP)  
> **Target Audience:** Developers, DevOps Engineers, Evaluators

---

## 1. System Requirements

- **Python:** 3.11, 3.12, or 3.13
- **Git:** 2.30+
- **Database:** PostgreSQL 15+ (Production/Docker) OR SQLite (Zero-config local development, supported out-of-the-box)
- **Containerization (Optional):** Docker 24+ & Docker Compose v2

---

## 2. Fast Local Setup (Zero External Dependencies)

By default, RippleIQ supports instant local development with SQLite without requiring an active PostgreSQL daemon.

### Step 1: Navigate to Backend Directory
Open PowerShell or your preferred terminal:
```bash
cd backend
```

### Step 2: Create and Activate Virtual Environment
```bash
# Windows PowerShell
python -m venv .venv
.venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Backend Dependencies
```bash
# Install core runtime dependencies
pip install -r requirements.txt

# Install development & testing tools
pip install -r requirements-dev.txt
```

> **Note:** Never install packages inside the `frontend/` directory during backend maintenance.

### Step 4: Configure Environment Variables
```bash
cp .env.example .env
```
Default `.env` values are tuned for local development:
```ini
APP_NAME=RippleIQ
ENVIRONMENT=development
DEBUG=True
PORT=8000
DATABASE_URL=sqlite:///./ripple_iq.db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Step 5: Initialize Database & Run Migrations
```bash
# Apply Alembic database migrations
alembic upgrade head
```
*(When using SQLite, `ripple_iq.db` will be initialized automatically).*

### Step 6: Start FastAPI Application Server
```bash
uvicorn app.main:app --reload --port 8000
```

### Step 7: Access API & Documentation
- **Interactive Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Liveness Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
- **Detailed System Health:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 3. Running with Docker & PostgreSQL

To run the complete production-parity stack with PostgreSQL:

```bash
# From the repository root
docker-compose up --build
```

- PostgreSQL runs on port `5432`.
- RippleIQ API runs on port `8000`.
- Automatic healthchecks ensure the database is ready before the API accepts traffic.

To shut down:
```bash
docker-compose down -v
```

---

## 4. Running the Test Suite

RippleIQ includes comprehensive automated test coverage for API endpoints, database operations, and the deterministic AI simulation engine.

```bash
# Run all backend tests
pytest backend/tests/ -v

# Run AI mock analyzer tests specifically
pytest ai/tests/ -v

# Run with test coverage
pytest --cov=backend/app --cov=ai
```

---

## 5. Code Quality & Formatting

RippleIQ uses [Ruff](https://docs.astral.sh/ruff/) for fast Python linting and code formatting:

```bash
# Check for lint violations
ruff check backend/ ai/

# Auto-fix fixable issues
ruff check --fix backend/ ai/

# Format code
ruff format backend/ ai/
```

---

## 6. Testing the Demo Decision Flow via cURL

You can execute the end-to-end university attendance decision flow in 5 commands:

### 1. Create Decision
```bash
curl -X POST http://localhost:8000/api/v1/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Reduce in-person university attendance from five days to four days per week",
    "description": "Evaluate transition to a 4-day condensed on-campus schedule.",
    "department": "Office of the Provost"
  }'
```
*(Returns `id: 1`)*

### 2. Attach University Context
```bash
curl -X POST http://localhost:8000/api/v1/decisions/1/context \
  -H "Content-Type: application/json" \
  -d '{
    "student_population": 28000,
    "faculty_count": 1400,
    "active_laboratories": 85,
    "transit_dependency_rate": 68.5,
    "key_assumptions": ["Friday asynchronous instruction", "Accreditation hours preserved"]
  }'
```

### 3. Run Simulation
```bash
curl -X POST http://localhost:8000/api/v1/decisions/1/simulate
```

### 4. Retrieve Structured Simulation Results
```bash
curl -X GET http://localhost:8000/api/v1/decisions/1/result
```

### 5. Generate Markdown Report
```bash
curl -X GET http://localhost:8000/api/v1/decisions/1/report
```
