from app.core.config import get_settings


def test_valid_login_sets_session_and_returns_current_user(client):
    register_response = client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "correct-horse-battery-staple"},
    )

    assert register_response.status_code == 200
    assert register_response.json()["username"] == "analyst"
    cookie_name = get_settings().session_cookie_name
    assert cookie_name in register_response.cookies

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "analyst"


def test_invalid_login_returns_generic_failure(client):
    client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "correct-horse-battery-staple"},
    )

    unknown_user = client.post(
        "/api/auth/login",
        json={"username": "missing-user", "password": "wrong-password"},
    )
    wrong_password = client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "wrong-password"},
    )

    assert unknown_user.status_code == 401
    assert wrong_password.status_code == 401
    assert unknown_user.json() == wrong_password.json()


def test_logout_clears_authenticated_session(client):
    client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "correct-horse-battery-staple"},
    )

    logout_response = client.post("/api/auth/logout")
    assert logout_response.status_code == 200

    me_response = client.get("/api/auth/me")
    assert me_response.status_code == 401
