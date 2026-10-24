"""Database-backed fixed-window rate limits for sensitive routes."""

import hashlib
import hmac
import ipaddress
import logging
import math
import threading
import time
from dataclasses import dataclass

from fastapi import HTTPException, Request, status
from sqlalchemy import case, delete
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import settings
from app.models import RateLimitBucket, User

logger = logging.getLogger("rippleiq.rate_limit")
_cleanup_lock = threading.Lock()
_last_cleanup_monotonic = 0.0
_BUCKET_RETENTION_SECONDS = 86_400
_CLEANUP_INTERVAL_SECONDS = 1_800


@dataclass(frozen=True)
class RateLimitRule:
    """One counter in a fixed-window policy."""

    scope: str
    identity: str
    limit: int
    window_seconds: int


def is_ip_in_networks(ip_str: str, networks: list[ipaddress.IPv4Network | ipaddress.IPv6Network]) -> bool:
    try:
        addr = ipaddress.ip_address(ip_str)
        return any(addr in net for net in networks)
    except ValueError:
        return False


def client_ip(request: Request) -> str:
    """
    Return the client IP.
    If TRUSTED_PROXIES is configured and the direct ASGI peer matches a trusted proxy,
    the client IP is extracted from the rightmost untrusted address in X-Forwarded-For.
    Otherwise, forwarded headers are strictly ignored and the direct ASGI peer is returned.
    """
    raw_ip = request.client.host if request.client else "unknown"
    try:
        peer_ip = ipaddress.ip_address(raw_ip).compressed
    except ValueError:
        return "unknown"

    trusted_nets = settings.trusted_proxy_networks
    if not trusted_nets or not is_ip_in_networks(peer_ip, trusted_nets):
        return peer_ip

    forwarded = request.headers.get("x-forwarded-for")
    if not forwarded:
        return peer_ip

    parts = [p.strip() for p in forwarded.split(",") if p.strip()]
    for part in reversed(parts):
        try:
            candidate = ipaddress.ip_address(part).compressed
            if not is_ip_in_networks(candidate, trusted_nets):
                return candidate
        except ValueError:
            continue

    return peer_ip


def enforce_limits(db: Session, rules: list[RateLimitRule]) -> None:
    """Atomically consume each rule, failing closed if the backing database is unavailable."""
    now = time.time()
    try:
        _cleanup_if_due(db, now)
        for rule in rules:
            retry_after = _consume_rule(db, rule, now)
            if retry_after is not None:
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={"code": "RATE_LIMIT_EXCEEDED", "message": "Too many requests. Try again later."},
                    headers={"Retry-After": str(retry_after)},
                )
        db.commit()
    except HTTPException:
        raise
    except (SQLAlchemyError, RuntimeError) as error:
        db.rollback()
        logger.warning("rate-limit storage unavailable", extra={"error_type": type(error).__name__})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "RATE_LIMIT_UNAVAILABLE", "message": "Request protection is temporarily unavailable."},
            headers={"Retry-After": "5"},
        ) from None


def login_rules(request: Request, email: str) -> list[RateLimitRule]:
    ip = client_ip(request)
    window = settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS
    return [
        RateLimitRule("auth.login.ip", ip, settings.RATE_LIMIT_LOGIN_IP_MAX, window),
        # Pairing the normalized account with the source IP avoids a global
        # account lockout that an attacker could trigger against a victim.
        RateLimitRule(
            "auth.login.account_ip",
            f"{ip}\0{email.strip().casefold()}",
            settings.RATE_LIMIT_LOGIN_ACCOUNT_IP_MAX,
            window,
        ),
    ]


def registration_rules(request: Request) -> list[RateLimitRule]:
    return [
        RateLimitRule(
            "auth.register.ip",
            client_ip(request),
            settings.RATE_LIMIT_REGISTER_IP_MAX,
            settings.RATE_LIMIT_REGISTER_WINDOW_SECONDS,
        )
    ]


def analysis_rules(request: Request, user: User, *, retry: bool = False) -> list[RateLimitRule]:
    if retry:
        user_limit = settings.RATE_LIMIT_RETRY_USER_MAX
        ip_limit = settings.RATE_LIMIT_RETRY_IP_MAX
        window = settings.RATE_LIMIT_RETRY_WINDOW_SECONDS
        scope = "analysis.retry"
    else:
        user_limit = settings.RATE_LIMIT_ANALYSIS_USER_MAX
        ip_limit = settings.RATE_LIMIT_ANALYSIS_IP_MAX
        window = settings.RATE_LIMIT_ANALYSIS_WINDOW_SECONDS
        scope = "analysis.start"
    return [
        RateLimitRule(f"{scope}.user", str(user.id), user_limit, window),
        RateLimitRule(f"{scope}.ip", client_ip(request), ip_limit, window),
    ]


def document_rules(request: Request, user: User) -> list[RateLimitRule]:
    return _user_and_ip_rules(
        "document.extract",
        request,
        user,
        settings.RATE_LIMIT_DOCUMENT_USER_MAX,
        settings.RATE_LIMIT_DOCUMENT_IP_MAX,
        settings.RATE_LIMIT_DOCUMENT_WINDOW_SECONDS,
    )


def voice_rules(request: Request, user: User) -> list[RateLimitRule]:
    return _user_and_ip_rules(
        "voice.transcribe",
        request,
        user,
        settings.RATE_LIMIT_VOICE_USER_MAX,
        settings.RATE_LIMIT_VOICE_IP_MAX,
        settings.RATE_LIMIT_VOICE_WINDOW_SECONDS,
    )


def _user_and_ip_rules(
    scope: str,
    request: Request,
    user: User,
    user_limit: int,
    ip_limit: int,
    window: int,
) -> list[RateLimitRule]:
    return [
        RateLimitRule(f"{scope}.user", str(user.id), user_limit, window),
        RateLimitRule(f"{scope}.ip", client_ip(request), ip_limit, window),
    ]


def _consume_rule(db: Session, rule: RateLimitRule, now: float) -> int | None:
    if rule.limit < 1 or rule.window_seconds < 1:
        raise RuntimeError("invalid rate-limit policy")
    window_id = math.floor(now / rule.window_seconds)
    key_hash = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        f"{rule.scope}\0{rule.identity}".encode(),
        hashlib.sha256,
    ).hexdigest()
    bind = db.get_bind()
    if bind.dialect.name == "postgresql":
        insert = postgresql_insert
    elif bind.dialect.name == "sqlite":
        insert = sqlite_insert
    else:
        raise RuntimeError("unsupported rate-limit database dialect")

    table = RateLimitBucket.__table__
    statement = insert(table).values(
        key_hash=key_hash,
        window_id=window_id,
        count=1,
        expires_at=(window_id + 1) * rule.window_seconds,
    )
    statement = statement.on_conflict_do_update(
        index_elements=[table.c.key_hash],
        set_={
            "window_id": case(
                (statement.excluded.window_id > table.c.window_id, statement.excluded.window_id),
                else_=table.c.window_id,
            ),
            "count": case(
                (statement.excluded.window_id > table.c.window_id, 1),
                (statement.excluded.window_id == table.c.window_id, table.c.count + 1),
                else_=table.c.count,
            ),
            "expires_at": case(
                (statement.excluded.window_id > table.c.window_id, statement.excluded.expires_at),
                else_=table.c.expires_at,
            ),
        },
    ).returning(table.c.count)
    count = db.execute(statement).scalar_one()
    if count > rule.limit:
        return max(1, math.ceil((window_id + 1) * rule.window_seconds - now))
    return None


def _cleanup_if_due(db: Session, now: float) -> None:
    global _last_cleanup_monotonic
    monotonic_now = time.monotonic()
    if monotonic_now - _last_cleanup_monotonic < _CLEANUP_INTERVAL_SECONDS:
        return
    if not _cleanup_lock.acquire(blocking=False):
        return
    try:
        if monotonic_now - _last_cleanup_monotonic < _CLEANUP_INTERVAL_SECONDS:
            return
        db.execute(delete(RateLimitBucket).where(RateLimitBucket.expires_at < int(now) - _BUCKET_RETENTION_SECONDS))
        _last_cleanup_monotonic = monotonic_now
    finally:
        _cleanup_lock.release()


def reset_rate_limits(db: Session) -> None:
    """Reset all persisted rate limit buckets (used for test teardown)."""
    db.execute(delete(RateLimitBucket))
    db.commit()
