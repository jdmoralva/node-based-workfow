describe("data models API proxy routes", () => {
  const originalApiBaseUrl = process.env.API_BASE_URL;

  beforeEach(() => {
    process.env.API_BASE_URL = "http://127.0.0.1:8000";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200, headers: { "content-type": "application/json" } }))
    );
  });

  afterEach(() => {
    process.env.API_BASE_URL = originalApiBaseUrl;
    vi.unstubAllGlobals();
  });

  it("proxies collection requests to the backend API", async () => {
    const { GET } = await import("@/app/api/data-models/route");

    const response = await GET(new Request("http://127.0.0.1:3000/api/data-models", { headers: { cookie: "rv_session=abc" } }));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/data-models", expect.objectContaining({ method: "GET" }));
  });

  it("proxies nested data model requests to the backend API", async () => {
    const { POST } = await import("@/app/api/data-models/[...path]/route");

    const response = await POST(new Request("http://127.0.0.1:3000/api/data-models/model_1/test", { method: "POST" }), { params: Promise.resolve({ path: ["model_1", "test"] }) });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/api/data-models/model_1/test", expect.objectContaining({ method: "POST" }));
  });
});
