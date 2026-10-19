"""Short, user-initiated audio transcription through Google's Gemini API."""

from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

SUPPORTED_AUDIO_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/aac",
}
LANGUAGE_CODES = {"en-US", "ar-IQ", "ar-SA"}


class TranscriptionError(Exception):
    """Safe error for an unavailable or invalid transcription result."""

    def __init__(self, code: str, message: str, status_code: int = 502) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def transcribe_audio(
    audio: bytes,
    mime_type: str,
    language: str,
    *,
    config: Any,
    client: httpx.Client | None = None,
) -> dict[str, str]:
    """Transcribe a short audio recording. Audio is sent inline and never persisted."""
    if not config.VOICE_TRANSCRIPTION_ENABLED:
        raise TranscriptionError("VOICE_TRANSCRIPTION_DISABLED", "Voice transcription is disabled.", 503)
    if not audio:
        raise TranscriptionError("EMPTY_AUDIO", "No recorded audio was received.", 400)
    if len(audio) > config.VOICE_TRANSCRIPTION_MAX_BYTES:
        raise TranscriptionError("AUDIO_TOO_LARGE", "The recording exceeds the size limit.", 413)
    normalized_type = mime_type.split(";", maxsplit=1)[0].strip().lower()
    if normalized_type not in SUPPORTED_AUDIO_TYPES:
        raise TranscriptionError("UNSUPPORTED_AUDIO_TYPE", "This audio format is not supported.", 415)
    if language not in LANGUAGE_CODES:
        raise TranscriptionError("UNSUPPORTED_LANGUAGE", "Choose a supported transcription language.", 422)

    keys = [key for key in (config.GEMINI_API_KEY_1, config.GEMINI_API_KEY_2) if key]
    if not keys:
        raise TranscriptionError("TRANSCRIPTION_NOT_CONFIGURED", "Voice transcription is not configured.", 503)

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Transcribe the spoken words verbatim. Return only the transcript, without commentary."},
                    {
                        "inlineData": {
                            "mimeType": normalized_type,
                            "data": base64.b64encode(audio).decode("ascii"),
                        }
                    },
                ]
            }
        ],
        "generationConfig": {"audioTranscriptionConfig": {"languageCodes": [language], "mode": "VERBATIM"}},
    }
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{config.VOICE_TRANSCRIPTION_MODEL}:generateContent"
    )
    last_category = "provider_unavailable"
    for key in keys:
        try:
            if client is None:
                response = httpx.post(
                    endpoint,
                    headers={"x-goog-api-key": key},
                    json=payload,
                    timeout=config.LLM_REQUEST_TIMEOUT_SECONDS,
                    follow_redirects=False,
                )
            else:
                response = client.post(endpoint, headers={"x-goog-api-key": key}, json=payload)
        except httpx.HTTPError:
            last_category = "provider_unavailable"
            continue
        if response.status_code < 200 or response.status_code >= 300:
            last_category = "provider_unavailable"
            # A second key may recover from a credential-specific or shared transient failure.
            if response.status_code in {401, 403, 429} or response.status_code >= 500:
                continue
            break
        try:
            result = response.json()
            candidates = result.get("candidates", [])
            candidate = candidates[0] if candidates else {}
            content = candidate.get("content", {})
            parts = content.get("parts", [])
            if (
                candidate.get("finishReason") == "STOP"
                and isinstance(parts, list)
                and not any(isinstance(part, dict) and part.get("text") for part in parts)
            ):
                raise TranscriptionError(
                    "NO_SPEECH_DETECTED", "No speech was detected. Try again or type instead.", 422
                )
            transcript = " ".join(part["text"].strip() for part in parts if isinstance(part, dict) and part.get("text"))
        except (ValueError, TypeError, KeyError, IndexError):
            transcript = ""
        if not transcript:
            last_category = "invalid_provider_response"
            break
        return {"transcript": transcript, "provider": "google_gemini", "model": config.VOICE_TRANSCRIPTION_MODEL}

    logger.warning("voice transcription failed: %s", last_category)
    raise TranscriptionError("TRANSCRIPTION_FAILED", "Could not transcribe this recording. Try again or type instead.")
