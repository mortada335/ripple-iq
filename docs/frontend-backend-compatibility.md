# Frontend and backend compatibility

This checklist reflects the current FastAPI routes and Pydantic schemas. The
frontend uses `NEXT_PUBLIC_API_URL` as its API origin and sends bearer tokens on
private requests. When an active organization is selected, it sends
`X-Organization-ID` for organization-scoped routes.

| Frontend action | Backend request | Authentication and payload | Response and errors |
| --- | --- | --- | --- |
| Register / login / current user | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` | Register `{email, full_name, password}`; login `{email, password}`; `/me` uses bearer token | User/token schemas; standard `{error:{code,message,details,timestamp}}`; validation is HTTP 422 |
| Organizations | `GET /api/v1/organizations`, `POST /api/v1/organizations`, `GET /api/v1/organizations/{id}` | Bearer token; create `{name,country}` | Organization schemas; membership and role errors use API error envelope |
| Decision list and detail | `GET /api/v1/decisions?offset=&limit=`, `GET /api/v1/decisions/{id}` | Bearer token and selected organization header | Decision response; inaccessible records return 404 |
| Create/update/archive decision | `POST /api/v1/decisions`, `PATCH /api/v1/decisions/{id}`, `DELETE /api/v1/decisions/{id}` | Create fields are `title`, `description`, `decision_type`, `department`, `time_horizon`, `priority`; PATCH accepts a subset. Delete archives and returns 204 | Decision response or common error envelope; role restrictions return authorization errors |
| Context | `GET/POST /api/v1/decisions/{id}/context`, `PATCH/DELETE /api/v1/context/{context_id}` | Bearer token + organization header; fields match `ContextDataCreate/Update` | Context response; POST upserts. Metadata is limited to 10,000 serialized characters |
| Analysis status/start/retry/result | `GET /api/v1/decisions/{id}/analysis`, `POST /api/v1/decisions/{id}/simulate`, `POST /api/v1/decisions/{id}/analysis/retry`, `GET /api/v1/decisions/{id}/result` | Bearer token + organization header. Simulation is synchronous; retry is only valid after a failed run | Actual status/result schemas; result is persisted. Missing or failed result is an API error. Client simulation timeout is 120 seconds |
| Recommendations/scenarios | `GET /api/v1/decisions/{id}/recommendation`, `POST /api/v1/decisions/{id}/refine`, `GET /api/v1/scenarios/{id}`, `/impacts`, `/risks` | Refine body `{feedback, selected_scenario_number?}` | Current/original recommendation and normalized records; refinements preserve original analysis |
| Reports | `GET /api/v1/decisions/{id}/report`, `GET /api/v1/decisions/{id}/report.md` | Bearer token + organization header | JSON report or Markdown attachment. Copy/print and optional client-side document export are local browser actions |
| Provider configuration | `GET /api/v1/ai/status` | Public, no credentials returned | Reports configured providers and policy, not provider reachability |
| Document extraction | `POST /api/v1/decisions/{id}/documents/extract` | Bearer token + organization header; raw file bytes with `source_document_id`, `source_version`, and `filename` query parameters | Per-page text with provenance and human verification flag. Upload/text is not persisted or included in analysis |

## Behavior and limitations

- Live API network failures are shown as errors. They do not silently replace
  the requested operation with browser mock data. Browser-local mock mode is
  available only when `NEXT_PUBLIC_USE_MOCK=true` or the user explicitly enters
  the demo workspace.
- Error responses are parsed from the backend's common envelope. A 401 clears
  the stale session; 403, 404, 409, 422, 429, and 5xx messages remain visible.
- Provider status reports configuration only; it is not a real inference health
  check. Stored result provenance shows provider, model, attempt count, fallback,
  and whether the result is mock-generated.
- Scenario selection submits a human preference via `POST /refine`; it does not
  rewrite the original analysis. The API has no risk acknowledgement endpoint,
  so risk review marks remain local to the page and are not represented as
  formally saved or audited.
- OCR is an extraction preview only. A reviewer must verify it and add any
  relevant facts to decision context separately.
- Organization profile extras and regional preferences remain browser-local;
  the API does not expose profile-preference persistence. Search/filter controls
  apply to the decisions currently loaded in the browser; the API exposes
  offset/limit pagination but no search/filter parameters.
- The API does not expose a simulation progress stream or cancel operation.
  The progress page uses an approximate visual sequence and its back link only
  navigates away; it does not cancel a synchronous request.

## Local environment

Copy `frontend/.env.example` to `frontend/.env.local`, then set
`NEXT_PUBLIC_API_URL` to the reachable backend origin. Configure backend CORS
`ALLOWED_ORIGINS` to include the frontend origin (typically
`http://localhost:3000`). Never put backend secrets or provider keys in frontend
environment variables.
