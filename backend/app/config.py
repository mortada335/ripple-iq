"""
RippleIQ Application Configuration
==================================
Loads settings from environment variables using Pydantic Settings.
"""

from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEVELOPMENT_SECRET = "local-development-secret-change-before-deployment"


class Settings(BaseSettings):
    APP_NAME: str = "RippleIQ"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = _DEVELOPMENT_SECRET
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://localhost/ripple_iq_db"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # AI Analyzer Backend
    ANALYZER_BACKEND: str = "mock_deterministic"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
        if self.DATABASE_URL.startswith("postgres://"):
            return self.DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
        return self.DATABASE_URL

    @model_validator(mode="after")
    def validate_production_secret(self) -> "Settings":
        if self.ENVIRONMENT.lower() in {"production", "prod"}:
            if self.sqlalchemy_database_url.startswith("sqlite:"):
                raise ValueError(
                    "SQLite is available only for development and tests; configure PostgreSQL in DATABASE_URL."
                )
            secret_is_placeholder = any(marker in self.SECRET_KEY.casefold() for marker in ("change", "replace"))
            if len(self.SECRET_KEY) < 32 or secret_is_placeholder:
                raise ValueError("Set SECRET_KEY to a private random value of at least 32 characters in production.")
            if any("*" in origin for origin in self.cors_origins):
                raise ValueError(
                    "Configure explicit ALLOWED_ORIGINS values in production; wildcard CORS is not allowed."
                )
        if self.ACCESS_TOKEN_EXPIRE_MINUTES < 1:
            raise ValueError("ACCESS_TOKEN_EXPIRE_MINUTES must be positive.")
        return self


settings = Settings()
