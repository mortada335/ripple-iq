"""
RippleIQ FastAPI Application Entrypoint
=======================================
Configures the FastAPI application, CORS middleware, global error handlers,
and registers API routers.
"""

import json
import logging
import time
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from app.api.endpoints import router as api_router
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router
from app.config import settings
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class JsonLogFormatter(logging.Formatter):
    """Format application logs as one JSON object per line."""

    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, object] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for field in ("request_id", "path", "method", "status_code"):
            if hasattr(record, field):
                entry[field] = getattr(record, field)
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False)


logging.basicConfig(level=settings.LOG_LEVEL.upper(), format="%(message)s")
for _handler in logging.getLogger().handlers:
    _handler.setFormatter(JsonLogFormatter())
logger = logging.getLogger("rippleiq.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "RippleIQ provides institutional decision support for universities, "
        "enabling leadership to understand the consequences of decisions before implementing them."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    started_at = time.perf_counter()
    response = await call_next(request)
    logger.info(
        "request completed",
        extra={"method": request.method, "path": request.url.path, "status_code": response.status_code},
    )
    response.headers["X-Process-Time"] = f"{time.perf_counter() - started_at:.6f}"
    return response


# ==========================================
# Standardized Error Envelopes
# ==========================================


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail and "message" in detail:
        code = detail.get("code")
        message = detail.get("message")
        extra_details = detail.get("details", None)
    else:
        code = "HTTP_ERROR"
        message = str(detail)
        extra_details = None

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": extra_details,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    formatted_errors = [
        {"field": ".".join(str(loc) for loc in err.get("loc", [])), "message": err.get("msg")} for err in errors
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request payload failed schema validation.",
                "details": formatted_errors,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled request error", extra={"method": request.method, "path": request.url.path})
    # Sanitize stack traces — never leak internal traces to production clients
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred. Please contact institutional support.",
                "details": None,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        },
    )


# Register API routes
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(organizations_router)
