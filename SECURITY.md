# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

RippleIQ takes security vulnerabilities seriously. If you discover a security issue or potential vulnerability in RippleIQ, please do not report it through public GitHub issues.

Instead, please send an advisory email to:
`security@rippleiq.local` (or file a private GitHub Security Advisory).

Please include the following details in your report:
- A description of the issue and potential impact
- Steps to reproduce or proof-of-concept code
- The affected component (backend, AI mock engine, API endpoints)
- Any proposed remediation or mitigation

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Core Security & Ethical Principles

1. **Human-in-the-Loop Decision Support**:
   RippleIQ is an assistive intelligence tool designed strictly for **decision support**. It does not make executive decisions autonomously. All outputs, simulations, and recommendations are marked with `human_review_required: true`.
2. **Deterministic & Explainable Outputs**:
   During the MVP phase, simulations utilize deterministic models with explicit assumptions and confidence scores to prevent black-box hallucinations.
3. **Protection of Sensitive University Data**:
   - Institutional context data is scoped per decision and organization.
   - Secrets and environment tokens are strictly managed via environment variables and never logged or serialized to clients.
   - Stack traces and internal database errors are sanitized in all production-facing API responses.
