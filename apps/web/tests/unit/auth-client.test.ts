import { login, logout, getCurrentUser } from "@/lib/auth/auth-client";

describe("auth-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits credentialed login requests and returns an authenticated outcome", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ignored", username: "ignored" })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "1", username: "analyst" })
    });

    const result = await login(
      { username: "analyst", password: "correct-horse-battery-staple" },
      { apiBaseUrl: "http://127.0.0.1:8000" },
      fetchMock
    );

    expect(fetchMock).toHaveBeenNthCalledWith(1, "http://127.0.0.1:8000/api/auth/login", {
      body: JSON.stringify({ username: "analyst", password: "correct-horse-battery-staple" }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "http://127.0.0.1:8000/api/auth/me", {
      credentials: "include",
      method: "GET"
    });
    expect(result.kind).toBe("authenticated");
  });

  it("normalizes invalid credentials and backend unavailability", async () => {
    const unauthorizedFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const unavailableFetch = vi.fn().mockRejectedValue(new Error("network"));

    await expect(getCurrentUser({ apiBaseUrl: "http://127.0.0.1:8000" }, unauthorizedFetch)).resolves.toMatchObject({
      kind: "unauthenticated"
    });
    await expect(logout({ apiBaseUrl: "http://127.0.0.1:8000" }, unavailableFetch)).resolves.toMatchObject({
      kind: "backend_unavailable"
    });
  });

  it("fails closed when session confirmation cannot verify a successful login", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "1", username: "analyst" }) })
      .mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(
      login(
        { username: "analyst", password: "correct-horse-battery-staple" },
        { apiBaseUrl: "http://127.0.0.1:8000" },
        fetchMock
      )
    ).resolves.toMatchObject({ kind: "unauthenticated" });
  });
});
