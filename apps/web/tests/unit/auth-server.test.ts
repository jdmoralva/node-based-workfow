import { getCurrentUserFromCookieHeader, getServerAuthConfig } from "@/lib/auth/auth-server";

describe("auth-server", () => {
  it("defaults server-side session validation to the backend API", () => {
    expect(getServerAuthConfig({})).toEqual({ apiBaseUrl: "http://127.0.0.1:8000" });
  });

  it("forwards cookies to /api/auth/me without caching", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", username: "analyst" })
    });

    const result = await getCurrentUserFromCookieHeader("rv_session=abc", { apiBaseUrl: "http://api.internal:8000" }, fetchMock);

    expect(fetchMock).toHaveBeenCalledWith("http://api.internal:8000/api/auth/me", {
      cache: "no-store",
      headers: {
        cookie: "rv_session=abc"
      },
      method: "GET"
    });
    expect(result.kind).toBe("authenticated");
  });

  it("distinguishes unauthenticated and unavailable responses", async () => {
    const unauthorizedFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const unavailableFetch = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(getCurrentUserFromCookieHeader(undefined, { apiBaseUrl: "http://api.internal:8000" }, unauthorizedFetch)).resolves.toMatchObject({
      kind: "unauthenticated"
    });
    await expect(getCurrentUserFromCookieHeader("rv_session=abc", { apiBaseUrl: "http://api.internal:8000" }, unavailableFetch)).resolves.toMatchObject({
      kind: "backend_unavailable"
    });
  });
});
