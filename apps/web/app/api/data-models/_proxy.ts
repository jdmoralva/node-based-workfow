const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "expect",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function resolveApiBaseUrl(): string {
  return trimTrailingSlash(process.env.API_BASE_URL || "http://127.0.0.1:8000");
}

function buildForwardHeaders(headers: Headers): Headers {
  const forwardHeaders = new Headers();

  headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  return forwardHeaders;
}

export async function proxyDataModelsRequest(request: Request, path: string): Promise<Response> {
  const response = await fetch(new URL(path, `${resolveApiBaseUrl()}/`).toString(), {
    method: request.method,
    headers: buildForwardHeaders(request.headers),
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
    cache: "no-store",
    redirect: "manual"
  });

  const responseHeaders = new Headers();

  response.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      responseHeaders.append(key, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}
