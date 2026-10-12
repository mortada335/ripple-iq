"""
Tests for Health Check & Swagger Endpoints
"""

def test_root_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "RippleIQ"
    assert "version" in data


def test_api_v1_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["analyzer_mode"] == "mock_deterministic"
    assert "timestamp" in data


def test_docs_and_openapi(client):
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    schema = openapi_resp.json()
    assert schema["info"]["title"] == "RippleIQ"
    assert "/api/v1/decisions" in schema["paths"]
    assert "/api/v1/decisions/{id}/simulate" in schema["paths"]
    assert "/api/v1/decisions/{id}/result" in schema["paths"]
    assert "/api/v1/decisions/{id}/report" in schema["paths"]
