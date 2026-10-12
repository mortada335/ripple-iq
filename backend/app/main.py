"""
RippleIQ FastAPI Application Entrypoint
=======================================
Configures the FastAPI application, CORS middleware, global error handlers,
and registers API routers.
"""

from contextlib import asynccontextmanager
from datetime import UTC, datetime

from app.api.endpoints import router as api_router
from app.config import settings
from app.database import init_db
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup (especially useful for SQLite)
    init_db()
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
        {"field": ".".join(str(loc) for loc in err.get("loc", [])), "message": err.get("msg")}
        for err in errors
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
    # Sanitize stack traces — never leak internal traces to production clients
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred. Please contact institutional support.",
                "details": str(exc) if settings.DEBUG else None,
                "timestamp": datetime.now(UTC).isoformat(),
            }
        },
    )


# Register API routes
app.include_router(api_router)
