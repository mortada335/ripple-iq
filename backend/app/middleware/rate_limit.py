"""
High-Throughput In-Memory Rate Limiting Middleware
==================================================
Protects the API against denial-of-service, abusive request spikes, and brute force
attempts using a thread-safe sliding-window counter. Returns standard X-RateLimit-*
headers and an HTTP 429 response when limits are exceeded.
"""

import ipaddress
import logging
import threading
import time
from collections import defaultdict
from collections.abc import Callable
from datetime import UTC, datetime

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("rippleiq.rate_limit_middleware")


def get_client_ip(request: Request) -> str:
    """Extract client IP safely from ASGI scope."""
    host = request.client.host if request.client else "127.0.0.1"
    try:
        return ipaddress.ip_address(host).compressed
    except ValueError:
        return host or "127.0.0.1"


class SlidingWindowRateLimiter:
    """Thread-safe sliding window rate limiter."""

    def __init__(self):
        # key -> list of float timestamps (monotonic)
        self._history: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()
        self._last_cleanup = time.monotonic()

    def check_and_increment(
        self, key: str, max_requests: int, window_seconds: float
    ) -> tuple[bool, int, int]:
        """
        Check if request is permitted and record it.
        Returns:
            (allowed: bool, remaining_requests: int, retry_after_seconds: int)
        """
        now = time.monotonic()
        cutoff = now - window_seconds

        with self._lock:
            # Periodic cleanup of idle keys every 60s
            if now - self._last_cleanup > 60:
                self._cleanup(now)
                self._last_cleanup = now

            timestamps = self._history[key]
            # Prune timestamps older than the sliding window
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= max_requests:
                # Rate limit exceeded. Compute how long until the oldest call exits the window
                oldest = valid_timestamps[0]
                retry_after = max(1, int(oldest + window_seconds - now))
                self._history[key] = valid_timestamps
                return False, 0, retry_after

            valid_timestamps.append(now)
            self._history[key] = valid_timestamps
            remaining = max(0, max_requests - len(valid_timestamps))
            return True, remaining, 0

    def _cleanup(self, now: float) -> None:
        """Remove keys with no activity in the last 120 seconds."""
        cutoff = now - 120
        keys_to_delete = [
            k for k, timestamps in self._history.items() if not timestamps or timestamps[-1] < cutoff
        ]
        for k in keys_to_delete:
            del self._history[k]


# Global rate limiter instance
limiter = SlidingWindowRateLimiter()


class FastRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware applying tiered rate limits based on path sensitivity:
    - Auth endpoints (/api/v1/auth/login, /register): 20 req/min
    - AI / Simulation compute endpoints (/simulate, /refine): 40 req/min
    - General endpoints: 300 req/min
    - Static / Health / Docs: Unlimited
    """

    EXEMPT_PATHS = {"/docs", "/redoc", "/openapi.json", "/health", "/api/v1/health"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # Exempt static documentation and health check endpoints
        if path in self.EXEMPT_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            return await call_next(request)

        ip = get_client_ip(request)

        # Tiered limits: (limit, window_seconds, scope_name)
        if "/auth/login" in path or "/auth/register" in path:
            limit = 20
            window = 60.0
            scope = "auth"
        elif "/simulate" in path or "/refine" in path or "/documents/extract" in path:
            limit = 40
            window = 60.0
            scope = "compute"
        else:
            limit = 300
            window = 60.0
            scope = "general"

        key = f"{scope}:{ip}"
        allowed, remaining, retry_after = limiter.check_and_increment(key, limit, window)

        if not allowed:
            logger.warning(
                "rate limit triggered",
                extra={"path": path, "ip": ip, "scope": scope, "retry_after": retry_after},
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please slow down.",
                        "details": {"retry_after_seconds": retry_after, "limit": limit, "window_seconds": int(window)},
                        "timestamp": datetime.now(UTC).isoformat(),
                    }
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + retry_after)),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
