from app.core.config import get_settings


def test_login_sets_secure_httponly_session_cookie_and_logout_clears_it(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "analyst", "password": "correct-horse-battery-staple"},
    )

    cookie_name = get_settings().session_cookie_name
    set_cookie_header = response.headers.get("set-cookie", "")
    assert cookie_name in response.cookies
    assert "HttpOnly" in set_cookie_header
    assert "Secure" in set_cookie_header

    logout_response = client.post("/api/auth/logout")
    clear_cookie_header = logout_response.headers.get("set-cookie", "")
    assert cookie_name in clear_cookie_header
