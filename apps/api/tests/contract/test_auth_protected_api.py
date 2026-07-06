def test_protected_check_requires_authenticated_session(client):
    response = client.get("/api/auth/protected-check")

    assert response.status_code == 401
