from fastapi.testclient import TestClient


def test_health_endpoint_returns_expected_payload(api_client: TestClient) -> None:
    response = api_client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0", "sim_running": False}


def test_cors_headers_for_allowed_and_disallowed_origins(api_client: TestClient) -> None:
    allowed_response = api_client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    disallowed_response = api_client.get("/api/health", headers={"Origin": "http://evil.example"})

    assert allowed_response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-origin" not in disallowed_response.headers
