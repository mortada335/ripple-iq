# Backend Authentication and Security

## Accounts and tokens

- `POST /api/v1/auth/register` creates an account from an email, full name, and
  password (12–128 characters). Emails are trimmed and normalized to lowercase.
- Passwords are hashed with Argon2 through `pwdlib`; the API never returns the
  hash. Legacy accounts without a password hash cannot sign in until reset or
  re-registration is implemented.
- `POST /api/v1/auth/login` returns a signed HS256 bearer token. Tokens expire
  after `ACCESS_TOKEN_EXPIRE_MINUTES` (10,080 minutes, or 7 days, by default).
  Set this server-side environment variable to a positive number of minutes to
  change the session duration. The frontend follows the `expires_in` value in
  the login response. Existing tokens keep their original expiration; users must
  sign in again after deployment to receive a longer-lived token. Send tokens in the
  `Authorization: Bearer <token>` header. `GET /api/v1/auth/me` returns the
  authenticated user's public account fields.
- `SECRET_KEY` comes from the environment. Production startup rejects the
  development default, obvious placeholder values, and keys shorter than 32
  characters. Generate a private random value for each deployment. Never commit
  it or place it in logs.

## Organization roles and access

Every organization member has one role: `owner`, `admin`, `decision_maker`,
`reviewer`, or `viewer`.

| Action | Allowed roles |
|---|---|
| Read an organization and its decisions/results/reports | Any member |
| Create or change decisions, attach context, run simulations | Owner, admin, decision maker |
| Add organization members | Owner, admin |
| Grant owner/admin membership | Owner only |

An account joins an organization when it creates one (as owner), or when an
owner/admin adds an already registered account. Decision records are scoped to
their organization. If the caller belongs to several organizations, decision
creation requires `X-Organization-ID`; decision reads resolve access from the
decision's stored organization. An inaccessible decision returns the same 404
as a missing decision to avoid disclosing its existence.

Human recommendation refinement and report routes use the same decision
organization boundary. Refinement feedback is stored with its author and
analysis run, is not written to application logs, and does not overwrite the
original analysis result.

Authentication registration, successful/failed login attempts, decision and
context mutations, analysis attempts, report downloads, and document extraction
create audit log records. Failed-login entries do not store the submitted email
or password. Unexpected API errors return a generic response; logs retain the
request method/path and exception type without exception messages or tracebacks,
which may contain SQL or configuration details. `/api/v1/health` reports
database connectivity and analyzer mode, but not credentials or provider
reachability. Production configuration rejects wildcard CORS origins and
placeholder/short signing keys. Context assumption strings are capped at 500
characters and custom JSON metadata at 50 top-level fields and 10,000 serialized
characters.

## Deployment and remaining work

Set `DATABASE_URL` and `SECRET_KEY` in the backend process environment. The
connection URI is not stored in the repository. The current Neon connection can
be replaced later with a VPC-private PostgreSQL URI without a code change.

The document extraction endpoint accepts authenticated raw bytes for an
existing decision and checks organization access before processing. It enforces
file-size, page-count, processing-time, and local concurrency limits. It returns
per-page extracted text and provenance but does not persist the source or text;
OCR runs locally. Optional Marker processing is isolated and may require a
separate worker. Voice transcription is a separate authenticated feature that
sends user-recorded audio to the configured Google Gemini API; audio is not
persisted by RippleIQ. See `docs/ai-provider-ocr.md` and `docs/api-contract.md`
for operational limits. Provider keys belong in environment configuration or a
secret manager. Logs and API errors expose sanitized provider categories only.

The browser currently stores the bearer access token in `localStorage` so a
session survives refresh. This keeps the token accessible to same-origin
JavaScript; a successful cross-site scripting attack could steal it. A future
session design should consider short-lived access tokens with an `HttpOnly`,
`Secure`, `SameSite` refresh cookie and CSRF protection, without placing secrets
in browser storage.

Email verification, password reset, invitation workflows, token revocation,
Email verification, password reset, invitation workflows, and token revocation
are not implemented. Sensitive endpoints have database-backed per-IP and/or
per-user request limits; see `docs/rate-limiting.md` for exact policies and
deployment requirements. These limits do not mitigate volumetric or distributed
denial-of-service attacks. Current tests cover selected authorization boundaries
and error sanitization, but do not establish a complete penetration test or
production threat assessment.
