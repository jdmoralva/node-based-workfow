describe("connections API proxy routes", () => {
  const originalApiBaseUrl = process.env.API_BASE_URL;

  beforeEach(() => {
    process.env.API_BASE_URL = "http://127.0.0.1:8000";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ connections: [] }), { status: 200, headers: { "content-type": "application/json" } }))
    );
  });

  afterEach(() => {
    process.env.API_BASE_URL = originalApiBaseUrl;
    vi.unstubAllGlobals();
  });

  it("proxies collection requests to the backend API", async () => {
    const { GET } = await import("@/app/api/connections/route");

    const response = await GET(new Request("http://127.0.0.1:3000/api/connections", { headers: { cookie: "rv_session=abc" } }));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/connections", expect.objectContaining({ method: "GET" }));
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ get: expect.any(Function) }) })
    );
  });

  it("proxies nested connection requests to the backend API", async () => {
    const { GET } = await import("@/app/api/connections/[...path]/route");

    const response = await GET(new Request("http://127.0.0.1:3000/api/connections/databases"), { params: Promise.resolve({ path: ["databases"] }) });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/connections/databases", expect.objectContaining({ method: "GET" }));
  });
});
