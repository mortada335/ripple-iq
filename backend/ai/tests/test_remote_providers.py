import json

import httpx
import pytest

from ai.provider import DeterministicMockProvider
from ai.remote_providers import (
    GoogleGeminiAnalyzer,
    HttpAnalyzer,
    MultiProviderAnalyzer,
    OpenAICompatibleAnalyzer,
    ProviderConfig,
    ProviderFailure,
    ProviderRefusal,
    _gemini_schema,
    create_analyzer,
)
from ai.schemas import AnalysisResult


def _valid_result() -> dict:
    return DeterministicMockProvider().analyze("Review university attendance policy").model_dump(mode="json")


def _proxy_response(result: dict) -> dict:
    return {"choices": [{"finish_reason": "stop", "message": {"content": json.dumps(result)}}]}


def _gemini_response(result: dict) -> dict:
    return {"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(result)}]}}]}


def _provider(cls, name: str, result: dict, *, status: int = 200):
    def handler(request: httpx.Request) -> httpx.Response:
        if status != 200:
            return httpx.Response(status)
        body = _proxy_response(result) if cls is OpenAICompatibleAnalyzer else _gemini_response(result)
        return httpx.Response(200, json=body)

    config = ProviderConfig(name, "verified-model", "https://unit.test/inference", "unit-test-key", 1, 0)
    return cls(config, httpx.Client(transport=httpx.MockTransport(handler)))


def test_proxy_success_returns_validated_provenance():
    provider = _provider(OpenAICompatibleAnalyzer, "openai_compatible_proxy", _valid_result())
    result = provider.analyze("Review university attendance policy")
    assert result.provenance.provider == "openai_compatible_proxy"
    assert result.provenance.model == "verified-model"
    assert result.provenance.is_mock is False


def test_old_saved_analysis_without_scenario_rationale_remains_readable():
    result = _valid_result()
    for scenario in result["scenarios"]:
        scenario.pop("rationale")

    parsed = AnalysisResult.model_validate(result)

    assert all(scenario.rationale is None for scenario in parsed.scenarios)


def test_provider_rejects_new_output_without_scenario_rationale():
    result = _valid_result()
    result["scenarios"][1].pop("rationale")
    provider = _provider(OpenAICompatibleAnalyzer, "proxy", result)

    with pytest.raises(ProviderFailure, match="invalid_structured_output"):
        provider.analyze("Review university attendance policy")


def test_provider_rejects_new_output_without_scenario_steps():
    result = _valid_result()
    result["scenarios"][1]["key_changes"] = []
    provider = _provider(OpenAICompatibleAnalyzer, "proxy", result)

    with pytest.raises(ProviderFailure, match="invalid_structured_output"):
        provider.analyze("Review university attendance policy")


@pytest.mark.parametrize("failed_credentials", [1, 2])
def test_failover_tries_direct_gemini_credentials_in_order(failed_credentials):
    result = _valid_result()
    providers = [
        _provider(OpenAICompatibleAnalyzer, "openai_compatible_proxy", result, status=503),
        _provider(GoogleGeminiAnalyzer, "google_gemini_key_1", result, status=401 if failed_credentials == 2 else 200),
        _provider(GoogleGeminiAnalyzer, "google_gemini_key_2", result, status=200),
    ]
    manager = MultiProviderAnalyzer(
        providers[: failed_credentials + 1], DeterministicMockProvider(), degraded_mode_enabled=False
    )
    output = manager.analyze("Review university attendance policy")
    assert output.provenance.provider == "google_gemini"
    assert output.provenance.is_mock is False
    assert output.provenance.fallback_used is True


def test_all_real_providers_fail_and_degraded_mode_is_off():
    providers = [_provider(OpenAICompatibleAnalyzer, "openai_compatible_proxy", {}, status=401)]
    manager = MultiProviderAnalyzer(providers, DeterministicMockProvider(), degraded_mode_enabled=False)
    with pytest.raises(ProviderFailure, match="all_providers_unavailable"):
        manager.analyze("Review university attendance policy")


def test_explicit_degraded_mode_identifies_mock_provenance():
    providers = [_provider(OpenAICompatibleAnalyzer, "openai_compatible_proxy", {}, status=503)]
    manager = MultiProviderAnalyzer(providers, DeterministicMockProvider(), degraded_mode_enabled=True)
    result = manager.analyze("Review university attendance policy")
    assert result.provenance.provider == "deterministic_mock"
    assert result.provenance.is_mock is True
    assert result.provenance.fallback_used is True


@pytest.mark.parametrize(
    ("status", "category", "retryable"),
    [
        (401, "credential_or_permission", False),
        (403, "credential_or_permission", False),
        (404, "invalid_model_or_request", False),
        (429, "rate_limited", True),
        (503, "upstream_server_error", True),
    ],
)
def test_http_failures_are_classified(status, category, retryable):
    provider = _provider(OpenAICompatibleAnalyzer, "proxy", {}, status=status)
    with pytest.raises(ProviderFailure) as error:
        provider.analyze("Review policy")
    assert error.value.category == category
    assert error.value.retryable is retryable


def test_malformed_http_json_response_is_sanitized():
    provider = OpenAICompatibleAnalyzer(
        ProviderConfig("proxy", "model", "https://test", "secret", 1, 0),
        httpx.Client(transport=httpx.MockTransport(lambda _request: httpx.Response(200, content=b"not-json"))),
    )
    with pytest.raises(ProviderFailure) as error:
        provider.analyze("Review policy")
    assert error.value.category == "malformed_response"
    assert error.value.attempt_count == 1


def test_proxy_request_uses_openai_compatible_contract_without_logging_key():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        captured["auth"] = request.headers["Authorization"]
        return httpx.Response(200, json=_proxy_response(_valid_result()))

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = OpenAICompatibleAnalyzer(
        ProviderConfig("proxy", "gpt-5.5", "https://proxy.test/v1/chat/completions", "secret-test-key", 2, 0), client
    )
    provider.analyze("Change attendance")
    assert captured["url"] == "https://proxy.test/v1/chat/completions"
    assert captured["body"]["model"] == "gpt-5.5"
    assert captured["body"]["response_format"]["type"] == "json_schema"
    assert captured["auth"] == "Bearer secret-test-key"


def test_gemini_native_request_uses_selected_model_and_header_key():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["key"] = request.headers.get("x-goog-api-key")
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json=_gemini_response(_valid_result()))

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = GoogleGeminiAnalyzer(
        ProviderConfig(
            "google_gemini_key_1",
            "gemini-3.8-flash",
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
            "secret",
            2,
            0,
        ),
        client,
    )
    result = provider.analyze("Change attendance")
    assert captured["url"].endswith("gemini-3.8-flash:generateContent")
    assert captured["key"] == "secret"
    assert captured["body"]["generationConfig"]["responseMimeType"] == "application/json"
    schema = captured["body"]["generationConfig"]["responseSchema"]
    schema_text = json.dumps(schema)
    assert "$ref" not in schema_text
    assert '"const"' not in schema_text
    assert '"additionalProperties"' not in schema_text
    human_review_schema = schema["properties"]["human_review_required"]
    assert human_review_schema["type"] == "boolean"
    assert "enum" not in human_review_schema
    assert result.provenance.provider == "google_gemini"


def test_gemini_schema_converts_string_constants_and_drops_non_string_constants():
    schema = _gemini_schema(
        {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "status": {"const": "completed", "type": "string"},
                "human_review_required": {"const": True, "type": "boolean"},
            },
        }
    )

    assert "additionalProperties" not in schema
    assert schema["properties"]["status"]["enum"] == ["completed"]
    assert schema["properties"]["human_review_required"] == {"type": "boolean"}


def test_four_day_attendance_prompt_preserves_required_pilot_scenario():
    prompt = HttpAnalyzer._analysis_prompt(
        "Move from five in-person days to four",
        "Reduce standard in-person university attendance from five days to four days per week.",
        {},
    )

    assert "explicit laboratory and clinical placement exemptions" in prompt
    assert "limited, reversible pilot" in prompt
    assert "Do not replace the pilot" in prompt


def test_car_purchase_prompt_uses_requested_scenarios_and_forbids_invented_financials():
    prompt = HttpAnalyzer._analysis_prompt(
        "Should I Buy a Car Now or Wait?",
        "Decide whether to buy now, save, or choose another transportation option.",
        {
            "raw_metadata": {
                "monthly_income_usd": 1000,
                "current_savings_usd": 6000,
                "target_car_price_usd": 8000,
                "estimated_monthly_living_expenses_usd": 500,
                "current_transportation_cost_usd": 120,
            }
        },
    )

    assert "1) buy the target car now" in prompt
    assert "2) postpone" in prompt
    assert "3) compare seeking a cheaper car or another" in prompt
    assert "without inventing a savings timeline" in prompt
    assert "label it provisional, not verified savings" in prompt
    assert "is $380" in prompt


def test_content_refusal_does_not_fall_through_to_another_provider():
    def refusal(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"choices": [{"finish_reason": "content_filter", "message": {"content": ""}}]})

    provider = OpenAICompatibleAnalyzer(
        ProviderConfig("proxy", "model", "https://test", "secret", 1, 0),
        httpx.Client(transport=httpx.MockTransport(refusal)),
    )
    manager = MultiProviderAnalyzer([provider], DeterministicMockProvider(), degraded_mode_enabled=True)
    with pytest.raises(ProviderRefusal):
        manager.analyze("Review policy")


def test_transient_retries_are_bounded(monkeypatch):
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(503)

    monkeypatch.setattr("ai.remote_providers.time.sleep", lambda *_args: None)
    provider = OpenAICompatibleAnalyzer(
        ProviderConfig("proxy", "model", "https://test", "secret", 1, 1),
        httpx.Client(transport=httpx.MockTransport(handler)),
    )
    with pytest.raises(ProviderFailure):
        provider.analyze("Review policy")
    assert calls == 2


def test_timeout_retries_are_bounded(monkeypatch):
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        raise httpx.ReadTimeout("network timeout")

    monkeypatch.setattr("ai.remote_providers.time.sleep", lambda *_args: None)
    provider = OpenAICompatibleAnalyzer(
        ProviderConfig("proxy", "model", "https://test", "secret", 1, 1),
        httpx.Client(transport=httpx.MockTransport(handler)),
    )
    with pytest.raises(ProviderFailure, match="network_or_timeout"):
        provider.analyze("Review policy")
    assert calls == 2


def test_circuit_cooldown_prevents_repeated_provider_calls():
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(503)

    provider = OpenAICompatibleAnalyzer(
        ProviderConfig("proxy", "model", "https://test", "secret", 1, 0),
        httpx.Client(transport=httpx.MockTransport(handler)),
    )
    manager = MultiProviderAnalyzer([provider], DeterministicMockProvider(), degraded_mode_enabled=True)
    manager.analyze("Review policy")
    manager.analyze("Review policy")
    assert calls == 1


def test_invalid_structured_output_is_corrected_only_once(monkeypatch):
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        body = {
            "choices": [
                {"finish_reason": "stop", "message": {"content": "{}" if calls == 1 else json.dumps(_valid_result())}}
            ]
        }
        return httpx.Response(200, json=body)

    provider = OpenAICompatibleAnalyzer(
        ProviderConfig("proxy", "model", "https://test", "secret", 1, 1),
        httpx.Client(transport=httpx.MockTransport(handler)),
    )
    result = provider.analyze("Review policy")
    assert calls == 2
    assert result.provenance.attempt_count == 2


def test_factory_preserves_proxy_then_two_gemini_key_priority():
    from types import SimpleNamespace

    config = SimpleNamespace(
        ANALYZER_BACKEND="multi_provider",
        LLM_REQUEST_TIMEOUT_SECONDS=45,
        LLM_MAX_RETRIES=1,
        LLM_PRIMARY_API_KEY="proxy-test-secret",
        LLM_PRIMARY_MODEL="gpt-5.5",
        LLM_PRIMARY_BASE_URL="https://proxy.test/api/v1",
        GEMINI_API_KEY_1="first-test-secret",
        GEMINI_API_KEY_2="second-test-secret",
        GEMINI_MODEL="gemini-3.8-flash",
        LLM_MAX_OUTPUT_TOKENS=None,
        LLM_FAILOVER_ENABLED=True,
        LLM_DEGRADED_MODE_ENABLED=False,
    )
    analyzer = create_analyzer(config, DeterministicMockProvider())
    assert [provider.provider_name for provider in analyzer.providers] == [
        "openai_compatible_proxy",
        "google_gemini_key_1",
        "google_gemini_key_2",
    ]
    assert analyzer.providers[0].config.endpoint == "https://proxy.test/api/v1/chat/completions"
    assert analyzer.providers[1].model == analyzer.providers[2].model == "gemini-3.8-flash"
