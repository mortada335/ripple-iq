# Contributing to RippleIQ

Thank you for your interest in contributing to RippleIQ! This document outlines guidelines and development practices for maintaining code quality, determinism, and safety across the codebase.

## Engineering Principles

1. **Simplicity and Readability**: Write clean, explicit Python code with clear type annotations (`typing`).
2. **Deterministic MVP Behavior**: The core AI analysis uses deterministic simulation logic in `ai/mock_analyzer.py` to ensure reproducible test suites without external API dependencies.
3. **Frontend Isolation**: The frontend resides in `frontend/`. Unless explicitly scoped, backend engineering tasks must never modify frontend code or bundle dependencies into the frontend tree.
4. **Validation First**: All API boundaries are strictly validated using Pydantic v2 schemas.
5. **No Leaked Secrets**: Configuration is strictly managed through `.env` files via Pydantic Settings.

## Development Workflow

### Prerequisites
- Python 3.11+ (Python 3.13 supported)
- Git
- Docker & Docker Compose (optional for local PostgreSQL)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   # macOS/Linux
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```
4. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
5. Run database migrations:
   ```bash
   alembic upgrade head
   ```
6. Start the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Running Tests and Linting
From the backend directory:
```bash
# Run pytest test suite
pytest -v

# Run linting and formatting checks
ruff check .
ruff format --check .
```

To run the AI analyzer tests independently:
```bash
pytest ai/tests/ -v
```

## Pull Request Guidelines

- Ensure all existing and new tests pass.
- Maintain test coverage for every new endpoint and service function.
- Keep commit messages concise and descriptive (e.g., `feat(backend): add stakeholder simulation endpoint`).
- Update documentation in `docs/` whenever an API contract or schema changes.
