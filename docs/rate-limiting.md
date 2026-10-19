# Sensitive route rate limits

RippleIQ uses fixed-window request counters in `rate_limit_buckets`. PostgreSQL
`INSERT .. ON CONFLICT .. RETURNING` updates each bucket atomically, so instances
sharing the same PostgreSQL database share counters. Run Alembic migrations
before deploying the code. SQLite supports local development and isolated tests;
it is not a distributed store and is not an acceptable production substitute.

| Route class | Default limit | Identity dimensions |
| --- | --- | --- |
| `POST /api/v1/auth/login` | 30 per IP and 8 per IP + normalized account per 15 minutes | Direct peer IP; account/IP pair |
| `POST /api/v1/auth/register` | 10 per IP per hour | Direct peer IP |
| `POST /api/v1/decisions/{id}/simulate` | 5 per user and 15 per IP per hour | Authenticated user ID and direct peer IP |
| `POST /api/v1/decisions/{id}/analysis/retry` | 3 per user and 10 per IP per hour | Authenticated user ID and direct peer IP |
| `POST /api/v1/decisions/{id}/documents/extract` | 10 per user and 30 per IP per hour | Authenticated user ID and direct peer IP |
| `POST /api/v1/voice/transcribe` | 20 per user and 60 per IP per hour | Authenticated user ID and direct peer IP |

The account component for login is paired with the source IP, not applied as a
global account lockout. This limits repeated guesses from one source without
letting a remote attacker exhaust a victim's account-wide login allowance.
Counts use fixed UTC windows, so requests near a window boundary can receive a
small burst across adjacent windows. Tune counts and window durations using the
matching `RATE_LIMIT_*` settings in `backend/.env.example`; all values must be
positive integers. Changes take effect when each API process restarts.

Identity keys are HMAC-SHA256 hashes using `SECRET_KEY`; the database does not
store raw IP addresses or account identifiers. Buckets are opportunistically
pruned after their window has expired for 24 hours. Secret-key rotation changes
the HMAC namespace and therefore resets effective counters; rotate with normal
deployment coordination.

The API uses the peer address supplied by the ASGI server's direct connection
(`request.client.host`) and ignores `X-Forwarded-For`, `Forwarded`, and similar
headers. This prevents client spoofing when proxy trust is not configured. If a
deployment later sits behind a load balancer, configure Uvicorn's trusted proxy
IPs narrowly and verify its behavior before relying on proxy-derived client
addresses. Do not enable trust for arbitrary peers.

If the rate-limit database operation fails or the database dialect is
unsupported, sensitive requests fail closed with `503 RATE_LIMIT_UNAVAILABLE`
and `Retry-After: 5`; limits are never silently disabled. Exceeding a limit
returns the common API error envelope with `429 RATE_LIMIT_EXCEEDED` and a
`Retry-After` value. This is request throttling, not a substitute for a WAF,
bot mitigation, or volumetric DDoS controls. Network-level distributed attacks
remain the responsibility of the hosting perimeter.
