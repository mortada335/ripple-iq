# RippleIQ analysis providers

`DecisionAnalyzer` in `provider.py` defines the interface for decision analysis.
The deterministic provider remains the default for tests and offline development.
The backend can build a `multi_provider` chain with the proxy first, then Google
Gemini key 1, then key 2, and the deterministic provider only when the explicit
degraded-mode setting permits it.

Hosted responses are parsed and validated against `AnalysisResult` in
`schemas.py`. The result includes non-secret provenance (`provider`, `model`,
attempt count, fallback use, and mock status). A mock result is therefore
explicitly identifiable in result reads. Model confidence remains an
uncalibrated decision-support score and `human_review_required` remains true.

Configuration and local setup are documented in `backend/README.md` and
`backend/.env.example`. Secrets must be provided by environment or a secret
manager and must not be committed. Startup does not call provider health or
model endpoints. Unit tests mock HTTP requests; a configured real provider must
be tested separately before deployment.

OCR is a separate optional service in `backend/app/services/document_processing.py`.
It accepts bytes only after the caller has checked organization permissions. The
MVP has no document upload route or document metadata table. See
`docs/ai-provider-ocr.md` before enabling OCR in a worker.
