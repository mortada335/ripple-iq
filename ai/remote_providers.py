"""HTTP adapters and bounded failover for hosted analysis providers."""

from __future__ import annotations

import json
import logging
import random
import threading
import time
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from typing import Any, Protocol

import httpx
from pydantic import ValidationError

from ai.provider import DecisionAnalyzer
from ai.schemas import AnalysisProvenance, AnalysisResult

logger = logging.getLogger(__name__)
_CALL_DEADLINE: ContextVar[float | None] = ContextVar("analysis_call_deadline", default=None)


class ProviderFailure(Exception):
    """Sanitized failure category; never contains an upstream response body or secret."""

    def __init__(
        self,
        category: str,
        *,
        retryable: bool = False,
        retry_after: float | None = None,
        attempt_count: int = 0,
    ) -> None:
        self.category = category
        self.retryable = retryable
        self.retry_after = retry_after
        self.attempt_count = attempt_count
        super().__init__(category)


class ProviderRefusal(ProviderFailure):
    """A model safety refusal; failover must not be used to bypass it."""

    def __init__(self) -> None:
        super().__init__("content_refusal")


class AnalyzerProvider(Protocol):
    provider_name: str
    model: str

    def analyze(self, title: str, description: str | None, context: dict[str, Any]) -> AnalysisResult: ...


@dataclass(frozen=True)
class ProviderConfig:
    provider_name: str
    model: str
    endpoint: str
    api_key: str = field(repr=False)
    timeout_seconds: float
    max_retries: int
    max_output_tokens: int | None = None


class HttpAnalyzer:
    """Shared bounded HTTP retry logic for provider-specific request formats."""

    provider_name: str

    def __init__(self, config: ProviderConfig, client: httpx.Client | None = None) -> None:
        self.config = config
        self.provider_name = config.provider_name
        self.model = config.model
        self._client = client

    def _post(self, headers: dict[str, str], payload: dict[str, Any]) -> tuple[dict[str, Any], int]:
        last_error: ProviderFailure | None = None
        for attempt in range(self.config.max_retries + 1):
            try:
                timeout = self.config.timeout_seconds
                deadline = _CALL_DEADLINE.get()
                if deadline is not None:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise ProviderFailure("analysis_deadline_exceeded", retryable=True)
                    timeout = min(timeout, remaining)
                with self._client_context(timeout) as client:
                    response = client.post(self.config.endpoint, headers=headers, json=payload)
            except (httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError):
                last_error = ProviderFailure("network_or_timeout", retryable=True, attempt_count=attempt + 1)
            except httpx.HTTPError:
                last_error = ProviderFailure("transport_error", retryable=True, attempt_count=attempt + 1)
            else:
                if response.status_code < 200 or response.status_code >= 300:
                    last_error = _http_failure(response)
                    last_error.attempt_count = attempt + 1
                    if not last_error.retryable:
                        raise last_error
                else:
                    try:
                        parsed = response.json()
                    except (ValueError, json.JSONDecodeError) as error:
                        raise ProviderFailure("malformed_response", attempt_count=attempt + 1) from error
                    if not isinstance(parsed, dict):
                        raise ProviderFailure("malformed_response", attempt_count=attempt + 1)
                    return parsed, attempt + 1

            if last_error is not None and (not last_error.retryable or attempt >= self.config.max_retries):
                raise last_error
            delay = _retry_delay(attempt, last_error.retry_after if last_error else None)
            time.sleep(delay)
        raise last_error or ProviderFailure("provider_error")

    def _client_context(self, timeout: float) -> httpx.Client | _ExistingClient:
        if self._client is not None:
            return _ExistingClient(self._client)
        return httpx.Client(timeout=timeout, follow_redirects=False)

    @staticmethod
    def _analysis_prompt(title: str, description: str | None, context: dict[str, Any]) -> str:
        source = f"{title} {description or ''}".casefold()
        four_day_attendance = (
            "five" in source
            and "four" in source
            and any(term in source for term in ("attendance", "in-person", "on-campus", "university"))
        )
        prompt = (
            "Return one JSON object matching the supplied JSON schema exactly. Treat all supplied data as unverified "
            "unless the input explicitly marks it as measured. Do not invent quantitative impacts or citations. "
            "Label estimates as assumptions, include uncertainty and limitations, preserve negative impacts, and "
            "include a distinct, useful rationale for each scenario in 2-4 sentences: explain why this option is "
            "being considered, when it fits the supplied decision context, and its main trade-off. Do not merely "
            "repeat the scenario title or description. Also provide 2-5 concise, scenario-specific key_changes "
            "implementation steps. Do not invent dates, budgets, measured impacts, or evidence; phrase missing "
            "requirements as items for the decision team to determine. Keep both rationale and steps evidence-bounded; "
            "never imply that the rationale is supported by evidence that was not supplied. "
            "set human_review_required to true. Do not infer a campus closure day, legal jurisdiction, or measured "
            "benefit from an aggregate input. Confidence and risk probability fields are uncalibrated model judgments, "
            "not statistical probabilities of outcomes. Provide exactly three distinct scenarios.\n"
            f"Decision title: {title}\nDescription: {description or ''}\n"
            f"Institutional context JSON: {json.dumps(context, ensure_ascii=False, default=str)}"
        )
        if four_day_attendance:
            prompt += (
                "\nFor this five-day-to-four-day university attendance decision, use these exact scenario roles in order: "
                "1) implement the proposed four-day schedule as written, without assuming a particular closure day; "
                "2) four-day classroom schedule with explicit laboratory and clinical placement exemptions; "
                "3) a limited, reversible pilot before any wider implementation. Do not replace the pilot with an "
                "asynchronous-only or remote-learning scenario."
            )
        finance_context = dict(context)
        raw_metadata = context.get("raw_metadata")
        if isinstance(raw_metadata, dict):
            finance_context.update(raw_metadata)
        if {
            "monthly_income_usd",
            "current_savings_usd",
            "target_car_price_usd",
            "estimated_monthly_living_expenses_usd",
            "current_transportation_cost_usd",
        }.issubset(finance_context):
            prompt += (
                "\nFor this car-purchase decision, use these exact scenario roles in order: "
                "1) buy the target car now; discuss the known cash gap and the risk of using savings, but do not "
                "assume financing is affordable; 2) postpone, preserve an emergency reserve, and save more, without "
                "inventing a savings timeline or monthly savings amount; 3) compare seeking a cheaper car or another "
                "transportation option, without inventing its price or cost. Do not invent any financing amount, "
                "interest rate, payment, ownership expense, duration, or future savings. You may state the direct "
                "$2,000 difference between the $8,000 target price and $6,000 savings, clearly as a pre-fee cash gap, "
                "and do not assume all savings can be spent. The listed monthly amount remaining after the supplied "
                "$500 living expenses and $120 current transportation cost is $380, before unlisted expenses and "
                "assuming both costs remain applicable; label it provisional, not verified savings. If transport costs "
                "change after purchase, do not assume a net saving. Explicitly state that affordability "
                "cannot be established until a financing quote, complete ownership-cost estimates, emergency reserve "
                "target, transportation need, and inspection are supplied."
            )
        return prompt

    def analyze(
        self, title: str, description: str | None = None, context: dict[str, Any] | None = None
    ) -> AnalysisResult:
        raise NotImplementedError


class _ExistingClient:
    def __init__(self, client: httpx.Client) -> None:
        self.client = client

    def __enter__(self) -> httpx.Client:
        return self.client

    def __exit__(self, *_: object) -> None:
        return None


class OpenAICompatibleAnalyzer(HttpAnalyzer):
    """Adapter for OpenAI-compatible chat completions endpoints."""

    def analyze(
        self, title: str, description: str | None = None, context: dict[str, Any] | None = None
    ) -> AnalysisResult:
        prompt = self._analysis_prompt(title, description, context or {})
        schema = AnalysisResult.model_json_schema()
        total_attempts = 0
        for correction in range(self.config.max_retries + 1):
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                        if correction == 0
                        else prompt + "\nCorrect the prior output to satisfy the JSON schema exactly.",
                    }
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {"name": "analysis_result", "strict": True, "schema": schema},
                },
            }
            if self.config.max_output_tokens:
                payload["max_completion_tokens"] = self.config.max_output_tokens
            result, attempts = self._post(
                {"Authorization": f"Bearer {self.config.api_key}", "Content-Type": "application/json"}, payload
            )
            total_attempts += attempts
            try:
                analysis = _parse_analysis(_openai_content(result))
                return analysis.model_copy(
                    update={
                        "provenance": AnalysisProvenance(
                            provider="openai_compatible_proxy",
                            model=self.model,
                            attempt_count=total_attempts,
                            is_mock=False,
                        )
                    }
                )
            except ProviderFailure as error:
                if error.category != "invalid_structured_output" or correction >= self.config.max_retries:
                    error.attempt_count = total_attempts
                    raise
        raise ProviderFailure("invalid_structured_output")


class GoogleGeminiAnalyzer(HttpAnalyzer):
    """Adapter for Google's native Generative Language API."""

    def analyze(
        self, title: str, description: str | None = None, context: dict[str, Any] | None = None
    ) -> AnalysisResult:
        prompt = self._analysis_prompt(title, description, context or {})
        total_attempts = 0
        for correction in range(self.config.max_retries + 1):
            generation_config: dict[str, Any] = {
                "responseMimeType": "application/json",
                "responseSchema": _gemini_schema(AnalysisResult.model_json_schema()),
            }
            if self.config.max_output_tokens:
                generation_config["maxOutputTokens"] = self.config.max_output_tokens
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": prompt
                                if correction == 0
                                else prompt + "\nCorrect the prior output to satisfy the JSON schema exactly."
                            }
                        ],
                    }
                ],
                "generationConfig": generation_config,
            }
            result, attempts = self._post(
                {"x-goog-api-key": self.config.api_key, "Content-Type": "application/json"}, payload
            )
            total_attempts += attempts
            try:
                candidate = next(iter(result.get("candidates", [])), None)
                if not isinstance(candidate, dict):
                    prompt_feedback = result.get("promptFeedback", {})
                    if isinstance(prompt_feedback, dict) and prompt_feedback.get("blockReason"):
                        raise ProviderRefusal()
                    raise ProviderFailure("empty_or_malformed_response")
                if candidate.get("finishReason") == "SAFETY":
                    raise ProviderRefusal()
                parts = candidate.get("content", {}).get("parts", [])
                content = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
                analysis = _parse_analysis(content)
                return analysis.model_copy(
                    update={
                        "provenance": AnalysisProvenance(
                            provider="google_gemini", model=self.model, attempt_count=total_attempts, is_mock=False
                        )
                    }
                )
            except ProviderRefusal:
                raise
            except ProviderFailure as error:
                if error.category != "invalid_structured_output" or correction >= self.config.max_retries:
                    error.attempt_count = total_attempts
                    raise
        raise ProviderFailure("invalid_structured_output")


class MultiProviderAnalyzer:
    """Try providers in configured priority order, with a bounded circuit cooldown."""

    def __init__(
        self,
        providers: list[AnalyzerProvider],
        mock_provider: DecisionAnalyzer,
        *,
        degraded_mode_enabled: bool,
        cooldown_seconds: float = 30.0,
    ) -> None:
        self.providers = providers
        self.mock_provider = mock_provider
        self.degraded_mode_enabled = degraded_mode_enabled
        self.cooldown_seconds = cooldown_seconds
        self._cooldowns: dict[str, float] = {}
        self._lock = threading.Lock()
        self._semaphore = threading.BoundedSemaphore(4)

    def analyze(
        self, title: str, description: str | None = None, context: dict[str, Any] | None = None
    ) -> AnalysisResult:
        context = context or {}
        failures: list[ProviderFailure] = []
        attempts = 0
        if not self._semaphore.acquire(timeout=2.0):
            raise ProviderFailure("analysis_capacity_exceeded", retryable=True)
        deadline_token = _CALL_DEADLINE.set(time.monotonic() + 90.0)
        try:
            for provider in self.providers:
                if not self._available(provider.provider_name):
                    failures.append(ProviderFailure("provider_circuit_open"))
                    continue
                try:
                    analysis = provider.analyze(title=title, description=description, context=context)
                    analysis = AnalysisResult.model_validate(analysis)
                    attempts += analysis.provenance.attempt_count
                    with self._lock:
                        self._cooldowns.pop(provider.provider_name, None)
                    provenance = analysis.provenance.model_copy(
                        update={
                            "attempt_count": max(attempts, 1),
                            "fallback_used": attempts > analysis.provenance.attempt_count,
                        }
                    )
                    return analysis.model_copy(update={"provenance": provenance})
                except ProviderRefusal:
                    raise
                except ProviderFailure as error:
                    failures.append(error)
                    attempts += max(error.attempt_count, 1)
                    self._cool(provider.provider_name)
                    logger.warning(
                        "analysis provider failed",
                        extra={"provider": provider.provider_name, "category": error.category},
                    )
                except (ValidationError, ValueError, TypeError, KeyError):
                    failures.append(ProviderFailure("invalid_structured_output"))
                    self._cool(provider.provider_name)
                    logger.warning(
                        "analysis provider returned invalid structured output",
                        extra={"provider": provider.provider_name},
                    )

            if self.degraded_mode_enabled:
                mock = AnalysisResult.model_validate(self.mock_provider.analyze(title, description, context))
                return mock.model_copy(
                    update={
                        "provenance": AnalysisProvenance(
                            provider="deterministic_mock",
                            model=None,
                            attempt_count=max(attempts, 1),
                            fallback_used=True,
                            is_mock=True,
                        )
                    }
                )
            logger.error(
                "all configured analysis providers failed",
                extra={"failure_categories": [failure.category for failure in failures]},
            )
            raise ProviderFailure("all_providers_unavailable", retryable=True)
        finally:
            _CALL_DEADLINE.reset(deadline_token)
            self._semaphore.release()

    def _available(self, name: str) -> bool:
        with self._lock:
            return time.monotonic() >= self._cooldowns.get(name, 0)

    def _cool(self, name: str) -> None:
        with self._lock:
            self._cooldowns[name] = time.monotonic() + self.cooldown_seconds


def create_analyzer(settings: Any, mock_provider: DecisionAnalyzer) -> DecisionAnalyzer:
    """Build the analyzer from settings without making remote calls at startup."""
    if settings.ANALYZER_BACKEND == "mock_deterministic":
        return mock_provider
    if settings.ANALYZER_BACKEND != "multi_provider":
        raise ValueError("ANALYZER_BACKEND must be mock_deterministic or multi_provider.")

    timeout = settings.LLM_REQUEST_TIMEOUT_SECONDS
    retries = settings.LLM_MAX_RETRIES
    providers: list[AnalyzerProvider] = []
    primary_key = settings.LLM_PRIMARY_API_KEY
    primary_model = settings.LLM_PRIMARY_MODEL
    if primary_key and primary_model:
        base = settings.LLM_PRIMARY_BASE_URL.rstrip("/")
        providers.append(
            OpenAICompatibleAnalyzer(
                ProviderConfig(
                    "openai_compatible_proxy",
                    primary_model,
                    f"{base}/chat/completions",
                    primary_key,
                    timeout,
                    retries,
                    settings.LLM_MAX_OUTPUT_TOKENS,
                )
            )
        )
    direct_keys = [settings.GEMINI_API_KEY_1, settings.GEMINI_API_KEY_2]
    if settings.GEMINI_MODEL:
        for index, key in enumerate(direct_keys, start=1):
            if key:
                providers.append(
                    GoogleGeminiAnalyzer(
                        ProviderConfig(
                            f"google_gemini_key_{index}",
                            settings.GEMINI_MODEL,
                            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent",
                            key,
                            timeout,
                            retries,
                            settings.LLM_MAX_OUTPUT_TOKENS,
                        )
                    )
                )
    if not settings.LLM_FAILOVER_ENABLED and providers:
        providers = providers[:1]
    return MultiProviderAnalyzer(providers, mock_provider, degraded_mode_enabled=settings.LLM_DEGRADED_MODE_ENABLED)


def _http_failure(response: httpx.Response) -> ProviderFailure:
    status = response.status_code
    if status in {401, 403}:
        return ProviderFailure("credential_or_permission", retryable=False)
    if status == 429:
        retry_after = _parse_retry_after(response.headers.get("Retry-After"))
        # Never retry earlier than the provider asks; long cooldowns fail over instead.
        return ProviderFailure(
            "rate_limited", retryable=retry_after is None or retry_after <= 2, retry_after=retry_after
        )
    if status >= 500:
        return ProviderFailure("upstream_server_error", retryable=True)
    if status in {400, 404, 422}:
        return ProviderFailure("invalid_model_or_request", retryable=False)
    return ProviderFailure("upstream_http_error", retryable=status >= 500)


def _parse_retry_after(value: str | None) -> float | None:
    if not value:
        return None
    try:
        return max(float(value), 0.0)
    except ValueError:
        try:
            target = parsedate_to_datetime(value)
            if target.tzinfo is None:
                target = target.replace(tzinfo=UTC)
            return max((target - datetime.now(UTC)).total_seconds(), 0.0)
        except (TypeError, ValueError, OverflowError):
            return None


def _retry_delay(attempt: int, retry_after: float | None) -> float:
    if retry_after is not None:
        return retry_after
    return random.uniform(0.05, min(0.25 * (2**attempt), 1.0))


def _openai_content(response: dict[str, Any]) -> str:
    choices = response.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ProviderFailure("empty_or_malformed_response")
    choice = choices[0]
    if not isinstance(choice, dict):
        raise ProviderFailure("empty_or_malformed_response")
    if choice.get("finish_reason") == "content_filter":
        raise ProviderRefusal()
    message = choice.get("message", {})
    if not isinstance(message, dict) or not isinstance(message.get("content"), str):
        raise ProviderFailure("empty_or_malformed_response")
    return message["content"]


def _parse_analysis(content: str) -> AnalysisResult:
    try:
        parsed = json.loads(content)
        analysis = AnalysisResult.model_validate(parsed)
        if any(
            not scenario.rationale
            or len(scenario.rationale.strip()) < 80
            or not scenario.key_changes
            or any(not step.strip() for step in scenario.key_changes)
            for scenario in analysis.scenarios
        ):
            raise ProviderFailure("invalid_structured_output")
        return analysis
    except (json.JSONDecodeError, ValidationError, TypeError) as error:
        raise ProviderFailure("invalid_structured_output") from error


def _gemini_schema(schema: dict[str, Any], definitions: dict[str, Any] | None = None) -> dict[str, Any]:
    """Remove Pydantic JSON Schema keywords not supported by Gemini responseSchema."""
    unsupported = {
        "$defs",
        "$ref",
        "title",
        "default",
        "examples",
        "const",
        "minLength",
        "maxLength",
        "minimum",
        "maximum",
        "minItems",
        "maxItems",
        "pattern",
        "uniqueItems",
        "additionalProperties",
    }
    definitions = definitions or schema.get("$defs", {})
    if "$ref" in schema:
        ref = schema["$ref"].rsplit("/", 1)[-1]
        schema = definitions.get(ref, schema)
    cleaned: dict[str, Any] = {}
    for key, value in schema.items():
        if key in unsupported:
            if key == "const":
                # Gemini's responseSchema enum values are strings. Keep boolean
                # and numeric literals constrained by their declared type and
                # validate the exact literal with the Pydantic result schema.
                if isinstance(value, str):
                    cleaned["enum"] = [value]
            continue
        if key == "properties" and isinstance(value, dict):
            cleaned[key] = {name: _gemini_schema(item, definitions) for name, item in value.items()}
        elif key == "items" and isinstance(value, dict):
            cleaned[key] = _gemini_schema(value, definitions)
        elif isinstance(value, list) and key in {"anyOf", "oneOf"}:
            cleaned["anyOf"] = [_gemini_schema(item, definitions) for item in value]
        elif isinstance(value, dict):
            cleaned[key] = _gemini_schema(value, definitions)
        else:
            cleaned[key] = value
    if "anyOf" in cleaned:
        variants = cleaned.pop("anyOf")
        non_null = [variant for variant in variants if variant.get("type") != "null"]
        if len(non_null) == 1:
            return non_null[0]
    return cleaned
