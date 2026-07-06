def test_protected_check_succeeds_with_valid_session(client):
    client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "correct-horse-battery-staple"},
    )

    response = client.get("/api/auth/protected-check")

    assert response.status_code == 200
    assert response.json()["authenticated"] is True
