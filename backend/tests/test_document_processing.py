import sys
import types
from pathlib import Path

import pytest
from app.services import document_processing as processing


class FakePage:
    def __init__(self, text: str = "") -> None:
        self.text = text

    def get_text(self, _kind: str) -> str:
        return self.text

    def get_pixmap(self, **_kwargs):
        return types.SimpleNamespace(tobytes=lambda _format: b"png-data")


class FakeDocument:
    def __init__(self, pages: list[FakePage]) -> None:
        self.pages = pages
        self.page_count = len(pages)

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def __iter__(self):
        return iter(self.pages)


def _fake_fitz(monkeypatch, pages: list[FakePage]):
    module = types.SimpleNamespace(open=lambda **_kwargs: FakeDocument(pages))
    monkeypatch.setitem(sys.modules, "pymupdf", module)


def _args(**overrides):
    content = overrides.pop("content", b"pdf-bytes")
    source_name = overrides.pop("source_name", "policy.pdf")
    config = types.SimpleNamespace(
        OCR_MAX_FILE_SIZE_BYTES=1000,
        OCR_MAX_PAGES=3,
        OCR_MAX_PROCESSING_SECONDS=2.0,
        OCR_ENABLED=True,
        OCR_BACKEND="tesseract",
    )
    for key, value in overrides.items():
        setattr(config, key, value)
    return {
        "content": content,
        "source_document_id": "doc-123",
        "organization_id": 42,
        "source_version": "v1",
        "source_name": source_name,
        "config": config,
    }


def test_digital_pdf_extraction_preserves_source_page_and_timestamp(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("University policy text with a readable digital layer.")])
    result = processing.process_document(**_args())
    assert result.pages[0].text.startswith("University policy")
    assert result.pages[0].backend == "pymupdf"
    assert result.pages[0].page_number == 1
    assert result.source_document_id == "doc-123"
    assert result.organization_id == 42
    assert result.source_version == "v1"
    assert result.extracted_at.tzinfo is not None


def test_scanned_page_uses_tesseract_fallback_and_adds_quality_warning(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("")])
    monkeypatch.setitem(
        sys.modules, "pytesseract", types.SimpleNamespace(image_to_string=lambda *_a, **_k: "Recognized scanned text")
    )
    image_package = types.ModuleType("PIL")
    image_module = types.SimpleNamespace(open=lambda _bytes: object())
    image_package.Image = image_module
    monkeypatch.setitem(sys.modules, "PIL", image_package)
    monkeypatch.setitem(sys.modules, "PIL.Image", image_module)
    monkeypatch.setattr(processing, "_import_fitz", lambda: sys.modules["pymupdf"])
    result = processing.process_document(**_args())
    assert result.pages[0].text == "Recognized scanned text"
    assert result.pages[0].backend == "tesseract"
    assert "verify" in result.pages[0].quality_warning


def test_missing_tesseract_executable_is_a_clear_backend_error(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("")])

    class TesseractNotFoundError(Exception):
        pass

    def fail_ocr(*_args, **_kwargs):
        raise TesseractNotFoundError()

    monkeypatch.setitem(
        sys.modules,
        "pytesseract",
        types.SimpleNamespace(image_to_string=fail_ocr, TesseractNotFoundError=TesseractNotFoundError),
    )
    image_package = types.ModuleType("PIL")
    image_module = types.SimpleNamespace(open=lambda _bytes: object())
    image_package.Image = image_module
    monkeypatch.setitem(sys.modules, "PIL", image_package)
    monkeypatch.setitem(sys.modules, "PIL.Image", image_module)
    with pytest.raises(processing.DocumentProcessingError) as error:
        processing.process_document(**_args())
    assert error.value.code == "OCR_BACKEND_UNAVAILABLE"


@pytest.mark.parametrize(
    ("args", "code"),
    [
        (_args(content=b""), "EMPTY_FILE"),
        (_args(content=b"x" * 1001), "FILE_TOO_LARGE"),
        (_args(source_name="policy.docx"), "UNSUPPORTED_FILE_TYPE"),
    ],
)
def test_invalid_documents_are_rejected_before_extraction(args, code):
    with pytest.raises(processing.DocumentProcessingError) as error:
        processing.process_document(**args)
    assert error.value.code == code


def test_scanned_file_with_ocr_disabled_is_returned_as_unverified_empty_text(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("")])
    args = _args(OCR_ENABLED=False)
    result = processing.process_document(**args)
    assert result.pages[0].text == ""
    assert result.pages[0].quality_warning


def test_page_limit_and_corrupted_file_fail_safely(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("a"), FakePage("b"), FakePage("c"), FakePage("d")])
    with pytest.raises(processing.DocumentProcessingError, match="configured page limit"):
        processing.process_document(**_args())

    monkeypatch.setitem(
        sys.modules,
        "pymupdf",
        types.SimpleNamespace(open=lambda **_kwargs: (_ for _ in ()).throw(ValueError("bad pdf"))),
    )
    with pytest.raises(processing.DocumentProcessingError) as error:
        processing.process_document(**_args())
    assert error.value.code == "CORRUPTED_FILE"


def test_marker_output_preserves_page_numbers():
    text = processing._marker_page_text(
        [
            {"id": "/page/0/Page/0", "html": "<p>first page</p>"},
            {"id": "/page/1/Page/0", "html": "<p>second page</p>"},
        ]
    )
    assert text == {1: "first page", 2: "second page"}


def test_marker_uses_temporary_local_files_and_offline_mode(monkeypatch):
    temporary_roots: list[Path] = []
    monkeypatch.setattr(processing.shutil, "which", lambda _name: "marker_single")

    def fake_run(command, **kwargs):
        source = Path(command[1])
        output_dir = Path(command[command.index("--output_dir") + 1])
        temporary_roots.append(source.parent)
        (output_dir / "converted.json").write_text(
            '[{"id":"/page/0/Page/1","html":"<p>marker output</p>"}]', encoding="utf-8"
        )
        assert kwargs["env"]["HF_HUB_OFFLINE"] == "1"
        return types.SimpleNamespace(returncode=0)

    monkeypatch.setattr(processing.subprocess, "run", fake_run)
    result = processing._extract_with_marker(b"local-bytes", ".pdf", 2.0)
    assert result == {1: "marker output"}
    assert temporary_roots
    assert all(not path.exists() for path in temporary_roots)


def test_marker_processing_failure_falls_back_to_tesseract(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("")])
    monkeypatch.setattr(
        processing,
        "_extract_with_marker",
        lambda *_args: (_ for _ in ()).throw(processing.DocumentProcessingError("MARKER_FAILED", "failed")),
    )
    monkeypatch.setattr(processing, "_extract_with_tesseract", lambda *_args: {1: "fallback text"})
    result = processing.process_document(**_args(OCR_BACKEND="marker"))
    assert result.pages[0].text == "fallback text"
    assert result.pages[0].backend == "tesseract"


def test_marker_can_be_selected_for_complex_digital_pdfs(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("Digital text that remains available as a fallback.")])
    monkeypatch.setattr(processing, "_extract_with_marker", lambda *_args: {1: "Reconstructed table and layout"})
    result = processing.process_document(**_args(OCR_BACKEND="marker"))
    assert result.pages[0].text == "Reconstructed table and layout"
    assert result.pages[0].backend == "marker"
    assert "verify" in result.pages[0].quality_warning


def test_page_processing_enforces_time_limit(monkeypatch):
    _fake_fitz(monkeypatch, [FakePage("Readable enough digital text layer")])
    ticks = iter([10.0, 11.0])
    monkeypatch.setattr(processing.time, "monotonic", lambda: next(ticks))
    args = _args(OCR_MAX_PROCESSING_SECONDS=0.5)
    with pytest.raises(processing.DocumentProcessingError) as error:
        processing.process_document(**args)
    assert error.value.code == "PROCESSING_TIMEOUT"


def test_document_processor_has_bounded_concurrency():
    assert processing._OCR_SEMAPHORE.acquire(blocking=False)
    try:
        with pytest.raises(processing.DocumentProcessingError) as error:
            processing.process_document(**_args())
        assert error.value.code == "OCR_CAPACITY_EXCEEDED"
    finally:
        processing._OCR_SEMAPHORE.release()
