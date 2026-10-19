import logging

import pytest
from app.main import unhandled_exception_handler
from starlette.requests import Request


@pytest.mark.asyncio
async def test_unhandled_exception_details_are_not_returned_or_logged(caplog):
    request = Request(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/internal",
            "raw_path": b"/internal",
            "query_string": b"",
            "headers": [],
            "client": ("127.0.0.1", 12345),
            "server": ("127.0.0.1", 8000),
        }
    )
    caplog.set_level(logging.ERROR, logger="rippleiq.api")
    response = await unhandled_exception_handler(request, RuntimeError("private-db-password=do-not-log"))

    assert response.status_code == 500
    assert b"private-db-password" not in response.body
    assert "private-db-password" not in caplog.text
    assert any(getattr(record, "error_type", None) == "RuntimeError" for record in caplog.records)
