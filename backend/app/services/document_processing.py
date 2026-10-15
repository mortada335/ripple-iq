"""Local, isolated document extraction for already-authorized document bytes.

This MVP has no document table or upload route. Callers must enforce organization
authorization before passing a document to this service.
"""

from __future__ import annotations

import html
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.config import settings

SUPPORTED_TYPES = {
    ".pdf": "pdf",
    ".png": "png",
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".tif": "tiff",
    ".tiff": "tiff",
}
_OCR_SEMAPHORE = threading.BoundedSemaphore(1)


class DocumentProcessingError(Exception):
    """Safe document processing error with a stable code."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        super().__init__(message)


@dataclass(frozen=True)
class ExtractedPage:
    page_number: int
    text: str
    backend: str
    quality_warning: str | None = None


@dataclass(frozen=True)
class ExtractedDocument:
    source_document_id: str
    organization_id: int
    source_version: str
    source_name: str
    extracted_at: datetime
    pages: tuple[ExtractedPage, ...]


def process_document(
    content: bytes,
    *,
    source_document_id: str,
    organization_id: int,
    source_version: str,
    source_name: str,
    config: Any = settings,
) -> ExtractedDocument:
    """Serialize local OCR work so it cannot consume unbounded API-worker capacity."""
    if not _OCR_SEMAPHORE.acquire(timeout=1.0):
        raise DocumentProcessingError("OCR_CAPACITY_EXCEEDED", "The document processor is busy; retry later.")
    try:
        return _process_document(
            content,
            source_document_id=source_document_id,
            organization_id=organization_id,
            source_version=source_version,
            source_name=source_name,
            config=config,
        )
    finally:
        _OCR_SEMAPHORE.release()


def _process_document(
    content: bytes,
    *,
    source_document_id: str,
    organization_id: int,
    source_version: str,
    source_name: str,
    config: Any,
) -> ExtractedDocument:
    """Extract text from authorized PDF/image bytes without network uploads."""
    if not content:
        raise DocumentProcessingError("EMPTY_FILE", "The document is empty.")
    if len(content) > config.OCR_MAX_FILE_SIZE_BYTES:
        raise DocumentProcessingError("FILE_TOO_LARGE", "The document exceeds the configured size limit.")
    suffix = Path(source_name).suffix.lower()
    file_type = SUPPORTED_TYPES.get(suffix)
    if file_type is None:
        raise DocumentProcessingError("UNSUPPORTED_FILE_TYPE", "Only PDF and common image documents are supported.")
    if not source_document_id or organization_id < 1 or not source_version:
        raise DocumentProcessingError(
            "SOURCE_METADATA_REQUIRED", "Document ID, organization, and version are required."
        )

    started = time.monotonic()
    fitz = _import_fitz()
    try:
        document = fitz.open(stream=content, filetype=file_type)
    except Exception as error:
        raise DocumentProcessingError("CORRUPTED_FILE", "The document could not be opened.") from error
    with document:
        if document.page_count < 1:
            raise DocumentProcessingError("EMPTY_DOCUMENT", "The document contains no pages.")
        if document.page_count > config.OCR_MAX_PAGES:
            raise DocumentProcessingError("TOO_MANY_PAGES", "The document exceeds the configured page limit.")
        pages: list[ExtractedPage] = []
        needs_ocr = False
        for index, page in enumerate(document):
            _check_deadline(started, config.OCR_MAX_PROCESSING_SECONDS)
            text = page.get_text("text").strip()
            scanned = len(text) < 30
            needs_ocr = needs_ocr or scanned
            pages.append(
                ExtractedPage(
                    page_number=index + 1,
                    text=text,
                    backend="pymupdf",
                    quality_warning="No usable digital text layer detected." if scanned else None,
                )
            )

        use_marker = config.OCR_BACKEND == "marker"
        if config.OCR_ENABLED and (needs_ocr or use_marker):
            if config.OCR_BACKEND == "marker":
                try:
                    ocr_pages = _extract_with_marker(
                        content, suffix, config.OCR_MAX_PROCESSING_SECONDS - (time.monotonic() - started)
                    )
                    backend = "marker"
                except DocumentProcessingError as error:
                    if error.code == "PROCESSING_TIMEOUT":
                        raise
                    ocr_pages = _extract_with_tesseract(document, started, config.OCR_MAX_PROCESSING_SECONDS)
                    backend = "tesseract"
            else:
                ocr_pages = _extract_with_tesseract(document, started, config.OCR_MAX_PROCESSING_SECONDS)
                backend = "tesseract"
            pages = [
                ExtractedPage(
                    page_number=page.page_number,
                    text=(
                        ocr_pages.get(page.page_number, "") or page.text
                        if backend == "marker"
                        else page.text or ocr_pages.get(page.page_number, "")
                    ),
                    backend=backend if ocr_pages.get(page.page_number, "").strip() else page.backend,
                    quality_warning=(
                        "Text extracted or reconstructed by OCR; verify against the original document."
                        if ocr_pages.get(page.page_number, "").strip()
                        else page.quality_warning
                    )
                    if not page.text or backend == "marker"
                    else None,
                )
                for page in pages
            ]
    return ExtractedDocument(
        source_document_id=source_document_id,
        organization_id=organization_id,
        source_version=source_version,
        source_name=Path(source_name).name,
        extracted_at=datetime.now(UTC),
        pages=tuple(pages),
    )


def _import_fitz() -> Any:
    try:
        import pymupdf
    except ImportError as error:
        raise DocumentProcessingError(
            "PDF_EXTRACTION_UNAVAILABLE", "Install the optional backend/requirements-ocr.txt dependencies."
        ) from error
    return pymupdf


def _extract_with_tesseract(document: Any, started: float, timeout_seconds: float) -> dict[int, str]:
    try:
        from io import BytesIO

        import pytesseract
        from PIL import Image
    except ImportError as error:
        raise DocumentProcessingError(
            "OCR_BACKEND_UNAVAILABLE", "Install the optional OCR dependencies and the Tesseract executable."
        ) from error
    output: dict[int, str] = {}
    for index, page in enumerate(document):
        if len(page.get_text("text").strip()) >= 30:
            continue
        remaining = timeout_seconds - (time.monotonic() - started)
        if remaining <= 0:
            raise DocumentProcessingError("PROCESSING_TIMEOUT", "Document extraction exceeded its time limit.")
        image_bytes = page.get_pixmap(dpi=160, alpha=False).tobytes("png")
        try:
            output[index + 1] = pytesseract.image_to_string(Image.open(BytesIO(image_bytes)), timeout=remaining).strip()
        except pytesseract.TesseractNotFoundError as error:
            raise DocumentProcessingError(
                "OCR_BACKEND_UNAVAILABLE", "The Tesseract executable is not installed in this OCR worker."
            ) from error
        except RuntimeError as error:
            raise DocumentProcessingError("PROCESSING_TIMEOUT", "OCR exceeded its time limit.") from error
        except Exception as error:
            raise DocumentProcessingError("OCR_FAILED", "OCR could not extract text from the document.") from error
    return output


def _extract_with_marker(content: bytes, suffix: str, timeout_seconds: float) -> dict[int, str]:
    if timeout_seconds <= 0:
        raise DocumentProcessingError("PROCESSING_TIMEOUT", "Document extraction exceeded its time limit.")
    with tempfile.TemporaryDirectory(prefix="rippleiq-ocr-") as directory:
        root = Path(directory)
        source = root / f"source{suffix}"
        output = root / "out"
        output.mkdir()
        source.write_bytes(content)
        executable = shutil.which("marker_single")
        if executable is None:
            raise DocumentProcessingError("OCR_BACKEND_UNAVAILABLE", "Marker is not installed in this OCR worker.")
        command = [
            executable,
            str(source),
            "--output_dir",
            str(output),
            "--output_format",
            "json",
            "--disable_image_extraction",
        ]
        try:
            environment = os.environ.copy()
            environment["HF_HUB_OFFLINE"] = "1"
            completed = subprocess.run(
                command, capture_output=True, text=True, timeout=timeout_seconds, check=False, env=environment
            )
        except subprocess.TimeoutExpired as error:
            raise DocumentProcessingError("PROCESSING_TIMEOUT", "Marker extraction exceeded its time limit.") from error
        except OSError as error:
            raise DocumentProcessingError(
                "OCR_BACKEND_UNAVAILABLE", "Marker is not installed in this OCR worker."
            ) from error
        if completed.returncode != 0:
            raise DocumentProcessingError("MARKER_FAILED", "Marker could not extract the document.")
        files = list(output.glob("*.json"))
        if not files:
            raise DocumentProcessingError("MARKER_INVALID_OUTPUT", "Marker did not produce its expected JSON output.")
        try:
            parsed = json.loads(files[0].read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise DocumentProcessingError("MARKER_INVALID_OUTPUT", "Marker produced unreadable output.") from error
        return _marker_page_text(parsed)


def _marker_page_text(document: Any) -> dict[int, str]:
    pages: dict[int, str] = {}
    if isinstance(document, list):
        nodes = document
    elif isinstance(document, dict):
        nodes = document.get("children", [document])
    else:
        raise DocumentProcessingError("MARKER_INVALID_OUTPUT", "Marker output had an unexpected format.")
    for index, node in enumerate(nodes, start=1):
        if not isinstance(node, dict):
            continue
        text_parts: list[str] = []
        _walk_marker(node, text_parts)
        page_number = _page_number(node) or index
        pages[page_number] = "\n".join(part for part in text_parts if part).strip()
    return pages


def _walk_marker(node: Any, output: list[str]) -> None:
    if not isinstance(node, dict):
        return
    content = node.get("html") or node.get("text")
    if isinstance(content, str):
        cleaned = html.unescape(re.sub(r"<[^>]+>", " ", content))
        output.append(re.sub(r"\s+", " ", cleaned).strip())
    for child in node.get("children") or []:
        _walk_marker(child, output)


def _page_number(node: dict[str, Any]) -> int | None:
    block_id = node.get("id")
    if isinstance(block_id, str):
        match = re.search(r"/page/(\d+)/", block_id)
        if match:
            return int(match.group(1)) + 1
    return None


def _check_deadline(started: float, limit_seconds: float) -> None:
    if time.monotonic() - started > limit_seconds:
        raise DocumentProcessingError("PROCESSING_TIMEOUT", "Document extraction exceeded its time limit.")
