def test_backend_starts_without_frontend_and_serves_health(client):
    response = client.get("/api/health")

    assert response.status_code == 200
