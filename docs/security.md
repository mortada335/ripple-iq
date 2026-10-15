# Backend Authentication and Security

## Accounts and tokens

- `POST /api/v1/auth/register` creates an account from an email, full name, and
  password (12–128 characters). Emails are trimmed and normalized to lowercase.
- Passwords are hashed with Argon2 through `pwdlib`; the API never returns the
  hash. Legacy accounts without a password hash cannot sign in until reset or
  re-registration is implemented.
- `POST /api/v1/auth/login` returns a signed HS256 bearer token. Tokens expire
  after `ACCESS_TOKEN_EXPIRE_MINUTES` (30 by default). Send them in the
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
context mutations, analysis attempts, and report downloads create audit log
records. Failed-login entries do not store the submitted email or password.
`/api/v1/health` returns only connected/disconnected database state; SQL errors
are not included in API responses. Production configuration rejects wildcard
CORS origins and placeholder/short signing keys. Context assumption strings
are capped at 500 characters and custom JSON metadata at 50 top-level fields
and 10,000 serialized characters. There are no file-upload routes in this MVP.

## Deployment and remaining work

Set `DATABASE_URL` and `SECRET_KEY` in the backend process environment. The
connection URI is not stored in the repository. The current Neon connection can
be replaced later with a VPC-private PostgreSQL URI without a code change.

The optional document extraction service accepts in-memory bytes only and has
no upload or document retrieval endpoint. Callers must authorize each document
against its organization before invoking the service. Extraction returns the
document ID, organization, version, and page numbers; it does not persist
documents or send them to an external service. Marker runs offline in a separate
worker. See `docs/ai-provider-ocr.md` for limits and setup. Provider keys belong
in environment configuration or a secret manager. Logs and API errors expose
sanitized provider categories only.

Email verification, password reset, invitation workflows, token revocation,
and rate limiting are outside the current auth endpoints. Add rate limiting at
the API gateway or application layer before exposing login publicly.
