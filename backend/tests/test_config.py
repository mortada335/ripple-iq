import pytest
from app.config import Settings
from pydantic import ValidationError


def test_standard_postgres_url_uses_installed_psycopg2_driver():
    settings = Settings(DATABASE_URL="postgresql://db_user:db_password@localhost/rippleiq")
    assert settings.sqlalchemy_database_url == "postgresql+psycopg2://db_user:db_password@localhost/rippleiq"


def test_access_token_session_defaults_to_seven_days():
    settings = Settings()
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 7 * 24 * 60


def test_production_rejects_placeholder_signing_secret():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="replace-with-a-private-random-key-of-at-least-32-characters")


def test_production_accepts_private_length_signing_secret():
    settings = Settings(ENVIRONMENT="production", SECRET_KEY="r" * 64)
    assert settings.SECRET_KEY == "r" * 64


def test_production_rejects_wildcard_cors():
    with pytest.raises(ValidationError):
        Settings(ENVIRONMENT="production", SECRET_KEY="r" * 64, ALLOWED_ORIGINS="*")


def test_production_rejects_sqlite_database():
    with pytest.raises(ValidationError, match="SQLite is available only for development and tests"):
        Settings(ENVIRONMENT="production", SECRET_KEY="r" * 64, DATABASE_URL="sqlite:///./local.db")


def test_rate_limit_configuration_requires_positive_counts_and_windows():
    with pytest.raises(ValidationError, match="Rate-limit counts and window durations must be positive"):
        Settings(RATE_LIMIT_ANALYSIS_USER_MAX=0)
