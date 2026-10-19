"""
Pytest Fixtures for RippleIQ Backend
====================================
Sets up an isolated SQLite in-memory test database, applies schemas,
and provisions a FastAPI TestClient with dependency overrides.
"""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from ai.provider import DeterministicMockProvider

# Ensure backend and workspace root are in sys.path
backend_dir = Path(__file__).resolve().parent.parent
workspace_dir = backend_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(workspace_dir) not in sys.path:
    sys.path.insert(0, str(workspace_dir))

import app.services.simulation_service as simulation_service
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import Organization, OrganizationMember, User
from app.security.passwords import hash_password
from app.security.tokens import create_access_token

# Create in-memory SQLite engine for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def isolate_analyzer_from_configured_providers(monkeypatch):
    """Keep test analysis deterministic and never call configured real providers."""
    monkeypatch.setattr(settings, "ANALYZER_BACKEND", "mock_deterministic")
    monkeypatch.setattr(simulation_service, "default_analyzer", DeterministicMockProvider())


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Provides a freshly recreated isolated SQLite schema per test function."""
    connection = engine.connect()
    Base.metadata.drop_all(bind=connection)
    Base.metadata.create_all(bind=connection)
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    Base.metadata.drop_all(bind=connection)
    connection.close()


@pytest.fixture
def client(db_session):
    """Provides a TestClient wired to the isolated test database session."""
    organization = Organization(name="Test University", slug="test-university")
    user = User(
        email="owner@example.edu",
        full_name="Test Owner",
        password_hash=hash_password("test-fixture-password"),
    )
    user.organization = organization
    db_session.add(organization)
    db_session.add(user)
    db_session.flush()
    membership = OrganizationMember(organization_id=organization.id, user_id=user.id, role="owner")
    db_session.add(membership)
    db_session.commit()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    headers = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    with TestClient(app, headers=headers) as test_client:
        yield test_client
    app.dependency_overrides.clear()
