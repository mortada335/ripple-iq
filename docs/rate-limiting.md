# Rate Limiting Architecture & Sensitive Route Limits

RippleIQ implements a two-tier rate limiting architecture:

1. **Process-Local Burst Defense (`FastRateLimitMiddleware`)**:
   An in-memory sliding-window limiter operating per worker process. It provides immediate, high-throughput defense against request flooding and sudden traffic spikes before requests reach the database.
   *Note: Being process-local, this in-memory layer alone is NOT a substitute for distributed rate limiting in multi-worker or serverless deployments.*

2. **Distributed Atomic Store (`RateLimitBucket` via PostgreSQL)**:
   Fixed-window request counters persisted in the `rate_limit_buckets` table. PostgreSQL `INSERT .. ON CONFLICT .. RETURNING` updates each bucket atomically, ensuring multiple API workers, containers, or serverless functions sharing the same database share counters consistently. Run Alembic migrations before deploying the code. SQLite supports local development and isolated tests; it is not a distributed store and is not an acceptable production substitute.

| Route class | Default limit | Identity dimensions |
| --- | --- | --- |
| `POST /api/v1/auth/login` | 30 per IP and 8 per IP + normalized account per 15 minutes | Direct peer IP / trusted proxy client IP; account/IP pair |
| `POST /api/v1/auth/register` | 10 per IP per hour | Direct peer IP / trusted proxy client IP |
| `POST /api/v1/decisions/{id}/simulate` | 5 per user and 15 per IP per hour | Authenticated user ID and client IP |
| `POST /api/v1/decisions/{id}/analysis/retry` | 3 per user and 10 per IP per hour | Authenticated user ID and client IP |
| `POST /api/v1/decisions/{id}/documents/extract` | 10 per user and 30 per IP per hour | Authenticated user ID and client IP |
| `POST /api/v1/voice/transcribe` | 20 per user and 60 per IP per hour | Authenticated user ID and client IP |

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

## Reverse Proxy Trust & Client IP Extraction

By default, `TRUSTED_PROXIES` is empty (`""`). In this default configuration,
the API uses only the peer address supplied by the ASGI direct connection
(`request.client.host`) and **strictly ignores** `X-Forwarded-For` and other
forwarded headers. This prevents client IP spoofing by untrusted callers.

When deployed behind reverse proxies, load balancers, or CDNs (e.g., Cloudflare,
AWS ALB, Nginx, or Vercel edge routers), configure `TRUSTED_PROXIES` as a
comma-separated list of trusted proxy IP addresses or CIDR blocks:

```env
TRUSTED_PROXIES=127.0.0.1, 10.0.0.0/8, 172.16.0.0/12
```

When a request arrives from an ASGI peer matching `TRUSTED_PROXIES`, the API
traverses `X-Forwarded-For` from right to left and selects the rightmost IP
address that is *not* in `TRUSTED_PROXIES` as the client IP. If the ASGI peer is
not trusted, forwarded headers are discarded.

## Failure Behavior & Error Envelope

If the rate-limit database operation fails or the database dialect is
unsupported, sensitive requests fail closed with `503 RATE_LIMIT_UNAVAILABLE`
and `Retry-After: 5`; limits are never silently disabled. Exceeding a limit
returns the common API error envelope with `429 RATE_LIMIT_EXCEEDED` and a
`Retry-After` value. This is request throttling, not a substitute for a WAF,
bot mitigation, or volumetric DDoS controls. Network-level distributed attacks
remain the responsibility of the hosting perimeter.
