from types import SimpleNamespace

import httpx
from app.api import endpoints
from app.services.voice_transcription import TranscriptionError, transcribe_audio


def _config(**overrides):
    values = {
        "VOICE_TRANSCRIPTION_ENABLED": True,
        "VOICE_TRANSCRIPTION_MAX_BYTES": 1024,
        "VOICE_TRANSCRIPTION_MODEL": "gemini-3.5-transcribe",
        "GEMINI_API_KEY_1": "first-test-key",
        "GEMINI_API_KEY_2": "second-test-key",
        "LLM_REQUEST_TIMEOUT_SECONDS": 3,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class FakeClient:
    def __init__(self, statuses):
        self.statuses = iter(statuses)
        self.keys = []

    def post(self, _url, *, headers, json):
        self.keys.append(headers["x-goog-api-key"])
        status = next(self.statuses)
        if isinstance(status, tuple):
            return httpx.Response(200, json=status[1])
        if status == 200:
            return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"text": "A proposed change."}]}}]})
        return httpx.Response(status, json={"error": {"message": "private upstream details"}})


def test_transcription_uses_first_configured_gemini_key():
    client = FakeClient([200])
    result = transcribe_audio(b"audio", "audio/webm;codecs=opus", "en-US", config=_config(), client=client)

    assert result == {
        "transcript": "A proposed change.",
        "provider": "google_gemini",
        "model": "gemini-3.5-transcribe",
    }
    assert client.keys == ["first-test-key"]


def test_transcription_fails_over_to_second_key():
    client = FakeClient([429, 200])
    result = transcribe_audio(b"audio", "audio/webm", "ar-IQ", config=_config(), client=client)

    assert result["transcript"] == "A proposed change."
    assert client.keys == ["first-test-key", "second-test-key"]


def test_transcription_rejects_oversized_or_unsupported_audio():
    config = _config(VOICE_TRANSCRIPTION_MAX_BYTES=2)
    try:
        transcribe_audio(b"large", "audio/webm", "en-US", config=config, client=FakeClient([]))
    except TranscriptionError as error:
        assert error.code == "AUDIO_TOO_LARGE"
        assert error.status_code == 413
    else:
        raise AssertionError("oversized recording was accepted")

    try:
        transcribe_audio(b"audio", "application/octet-stream", "en-US", config=_config(), client=FakeClient([]))
    except TranscriptionError as error:
        assert error.code == "UNSUPPORTED_AUDIO_TYPE"
    else:
        raise AssertionError("unsupported audio type was accepted")


def test_empty_speech_response_does_not_retry_with_another_key():
    client = FakeClient([(200, {"candidates": [{"finishReason": "STOP", "content": {"parts": []}}]})])
    try:
        transcribe_audio(b"audio", "audio/wav", "en-US", config=_config(), client=client)
    except TranscriptionError as error:
        assert error.code == "NO_SPEECH_DETECTED"
        assert error.status_code == 422
    else:
        raise AssertionError("empty speech was accepted")
    assert client.keys == ["first-test-key"]


def test_voice_api_requires_authentication(client):
    response = client.post(
        "/api/v1/voice/transcribe",
        content=b"audio",
        headers={"Content-Type": "audio/webm", "Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401


def test_voice_api_enforces_organization_and_returns_transcript(client, monkeypatch):
    monkeypatch.setattr(
        endpoints,
        "transcribe_audio",
        lambda audio, mime, language, *, config: {
            "transcript": "Four day schedule.",
            "provider": "google_gemini",
            "model": "gemini-3.5-transcribe",
        },
    )
    response = client.post(
        "/api/v1/voice/transcribe",
        content=b"recorded audio",
        headers={
            "Content-Type": "audio/webm;codecs=opus",
            "X-Transcription-Language": "en-US",
            "X-Organization-ID": "1",
        },
    )

    assert response.status_code == 200
    assert response.json()["transcript"] == "Four day schedule."


def test_voice_api_rejects_invalid_media_type(client):
    response = client.post("/api/v1/voice/transcribe", content=b"text", headers={"Content-Type": "text/plain"})

    assert response.status_code == 415
    assert response.json()["error"]["code"] == "UNSUPPORTED_AUDIO_TYPE"
