import { readAuthSessionTestConfig, resolveAuthApiUrl } from "@/tests/helpers/auth-session";

describe("auth-session test helpers", () => {
  it("prefers explicit browser auth configuration and trims trailing slashes", () => {
    const config = readAuthSessionTestConfig({
      API_BASE_URL: "http://127.0.0.1:8000/",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:9000/",
      AUTH_SESSION_COOKIE_NAME: "custom_session",
      E2E_AUTH_USERNAME: "qa-user",
      E2E_AUTH_PASSWORD: "qa-password"
    });

    expect(config.apiBaseUrl).toBe("http://127.0.0.1:9000");
    expect(config.sessionCookieName).toBe("custom_session");
    expect(config.username).toBe("qa-user");
    expect(config.password).toBe("qa-password");
  });

  it("falls back to same-host defaults when browser auth variables are absent", () => {
    const config = readAuthSessionTestConfig({});

    expect(config.apiBaseUrl).toBe("http://127.0.0.1:3000");
    expect(config.sessionCookieName).toBe("rv_session");
    expect(config.username).toBe("analyst");
    expect(config.password).toBe("correct-horse-battery-staple");
  });

  it("builds auth endpoint URLs relative to the configured API base", () => {
    expect(resolveAuthApiUrl("/api/auth/me", { apiBaseUrl: "http://127.0.0.1:8000" })).toBe(
      "http://127.0.0.1:8000/api/auth/me"
    );
  });
});
