"""
RippleIQ Application Configuration
==================================
Loads settings from environment variables using Pydantic Settings.
"""

from pathlib import Path

from pydantic import Field, model_validator
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
    ANALYZER_BACKEND: str = "multi_provider"
    LLM_PRIMARY_BASE_URL: str = "https://gemini-proxy-nu-six.vercel.app/api/v1"
    LLM_PRIMARY_API_KEY: str = Field(default="", repr=False)
    LLM_PRIMARY_MODEL: str = ""
    GEMINI_API_KEY_1: str = Field(default="", repr=False)
    GEMINI_API_KEY_2: str = Field(default="", repr=False)
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    LLM_REQUEST_TIMEOUT_SECONDS: float = 45.0
    LLM_MAX_RETRIES: int = 1
    LLM_FAILOVER_ENABLED: bool = True
    LLM_DEGRADED_MODE_ENABLED: bool = False
    LLM_MAX_OUTPUT_TOKENS: int | None = None
    OCR_ENABLED: bool = True
    OCR_MAX_FILE_SIZE_BYTES: int = 10_485_760
    OCR_MAX_PAGES: int = 100
    OCR_MAX_PROCESSING_SECONDS: float = 30.0
    OCR_BACKEND: str = "tesseract"

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
        if self.ANALYZER_BACKEND not in {"mock_deterministic", "multi_provider"}:
            raise ValueError("ANALYZER_BACKEND must be mock_deterministic or multi_provider.")
        if self.LLM_REQUEST_TIMEOUT_SECONDS <= 0 or self.LLM_MAX_RETRIES < 0 or self.LLM_MAX_RETRIES > 3:
            raise ValueError("LLM timeout must be positive and retry count must be between 0 and 3.")
        if self.LLM_MAX_OUTPUT_TOKENS is not None and self.LLM_MAX_OUTPUT_TOKENS < 256:
            raise ValueError("LLM_MAX_OUTPUT_TOKENS must be at least 256 when set.")
        if self.OCR_MAX_FILE_SIZE_BYTES < 1 or self.OCR_MAX_PAGES < 1 or self.OCR_MAX_PROCESSING_SECONDS <= 0:
            raise ValueError("OCR resource limits must be positive.")
        if self.OCR_BACKEND not in {"tesseract", "marker"}:
            raise ValueError("OCR_BACKEND must be tesseract or marker.")
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
