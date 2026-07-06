def test_health_endpoint_returns_success_payload(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "service" in response.json()
