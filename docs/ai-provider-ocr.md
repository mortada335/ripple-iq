# AI provider failover and optional document extraction

## Provider selection

Set `ANALYZER_BACKEND=multi_provider` to enable this order:

1. The configured OpenAI-compatible proxy (`LLM_PRIMARY_BASE_URL`, API key, and
   model).
2. Native Google Gemini API using `GEMINI_API_KEY_1`.
3. Native Google Gemini API using `GEMINI_API_KEY_2`.
4. `DeterministicMockProvider` only if `LLM_DEGRADED_MODE_ENABLED=true`.

The proxy model endpoint was queried on 2026-10-14. Its returned IDs were
`gpt-5.5` and `claude-fable-5`; `gpt-5.5` is used as the example selection.
Google's current Generative Language API documentation illustrates the model
ID `gemini-3.8-flash` with `models.generateContent`; the selected model still
needs a credentialed request against the deployed Google project.

Provider requests have separate HTTP timeouts, bounded retries and jitter, a
90-second analysis wall-clock budget, a concurrency limit of four calls and a
30-second per-provider circuit cooldown. HTTP 401/403 and invalid-model/request
responses fail over without a same-provider retry. 429 honors a short
`Retry-After`; longer waits fail over. Content safety refusals stop the chain.
Invalid structured output can receive at most one corrective request, limited
by `LLM_MAX_RETRIES`. If all providers fail, the application either returns a
sanitized analysis failure or a clearly marked mock result, according to the
degraded-mode flag. Two Gemini keys may still share a project quota.

Each stored analysis JSON and result response has additive provenance fields:
provider, model, attempt count, whether failover was used, and mock status. No
API keys or upstream response bodies are stored. Existing rows without this
field validate using the legacy mock default; current local operation should
The code default is `multi_provider` with degraded mode off. The current local
`backend/.env` explicitly selects `mock_deterministic`; change it only after
newly rotated credentials are configured and tested. Mock mode remains useful
for offline development and deterministic tests.

## Credential handling

The credentials pasted into the project conversation are considered exposed.
Revoke and rotate them in their respective provider dashboards before setting
`LLM_PRIMARY_API_KEY`, `GEMINI_API_KEY_1`, and `GEMINI_API_KEY_2` in the process
environment or secret manager. Do not copy those values into this repository,
command lines, logs, test fixtures, or chat. The example file contains model
IDs but no secrets. Google currently documents that unrestricted standard API
keys are rejected; use keys restricted to the Gemini API or the supported
authorization-key flow. Requests send credentials in `x-goog-api-key` headers,
not in URL query strings.

## OCR service and document boundary

`POST /api/v1/decisions/{id}/documents/extract` authenticates the caller and
checks organization membership against the selected decision before reading or
processing the body. It streams at most 10 MiB into memory, then invokes the
local extraction service with the decision's actual organization ID. The
response carries page numbers, source ID/version, extraction time, extractor,
quality warning, and `human_verification_required: true`; an audit event records
the extraction metadata. This endpoint does not persist documents or extracted
text. Marker intermediate files use a temporary directory that is removed at
exit, and its subprocess runs in Hugging Face offline mode. No source document
is sent to an inference provider.

The current default OCR backend is local Tesseract; `pymupdf`, `pytesseract`,
Pillow and the Tesseract executable are optional worker dependencies. PyMuPDF
handles suitable digital PDF/image text and page rendering. Choosing
`OCR_BACKEND=marker` sends the local file through Marker even when a text layer
exists, so a document worker can use it for complex layouts/tables. Marker text
is preferred when returned; the PyMuPDF text remains as fallback. Missing
Marker/model assets or processing errors fall back to Tesseract, except for a
hard timeout. OCR text is always marked for human verification. A page with no
recognized text remains empty and carries a quality warning.

### Tool comparison

| Tool | Use | Tradeoff |
|---|---|---|
| PyMuPDF | First-pass digital PDF text, page count, and rasterization | Small and fast; scanned pages require OCR. |
| Tesseract | Lightweight local OCR fallback | Requires a separately installed native executable and language data; OCR layout/table reconstruction is limited. |
| Marker | Complex layout, tables, and OCR in an isolated worker | Python package depends on PyTorch and local inference assets; current repository docs describe vLLM with NVIDIA GPU or llama.cpp for CPU/Apple Silicon. Model weights have a modified AI Pubs Open Rail-M license separate from the Apache-2.0 code license. Review the model license, pre-stage assets, and measure target-worker memory/latency before enabling. |
| Docling | Alternative document parsing framework | Adds another dependency and runtime path; not selected until a representative corpus demonstrates a needed capability. |

Marker was not installed or executed in this environment. The upstream project
states Python 3.10+, PyTorch, separate model-weight terms, and local model-serving
requirements; it does not provide one universal RAM/VRAM minimum for this
application. Therefore no local OCR accuracy, memory, CPU/GPU, or latency
measurement is claimed. Install `requirements-marker.txt` only in a dedicated
worker after license and hardware review. `requirements-ocr.txt` is the lighter
Tesseract/PyMuPDF worker profile; the native Tesseract executable must also be
installed by the worker image. Neither optional profile is part of ordinary API
startup.

## Verification boundary

The proxy model list was fetched without sending an API key. A real analysis
request using Google Gemini completed successfully through the API in the
current environment; its stored provenance identified `google_gemini` and
`gemini-3.1-flash-lite`. The second Gemini credential and proxy inference
endpoint were not tested. Automated provider failover tests use
`httpx.MockTransport`; OCR unit tests stub OCR engines. The endpoint test also
generates a local digital PDF and exercises real PyMuPDF text extraction when
the optional OCR extra is installed. There is no Tesseract executable or
Marker runtime in the current environment, so scanned OCR and Marker quality
remain unverified.
