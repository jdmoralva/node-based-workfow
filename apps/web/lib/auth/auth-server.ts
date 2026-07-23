import {
  authenticatedAuthOutcome,
  backendUnavailableAuthOutcome,
  unauthenticatedAuthOutcome,
  unexpectedAuthErrorOutcome,
  type AuthOutcome,
  type AuthenticatedUser
} from "@/lib/auth/auth-types";

type ServerAuthConfig = {
  apiBaseUrl: string;
};

type FetchLike = typeof fetch;

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getServerAuthConfig(env: Record<string, string | undefined> = process.env): ServerAuthConfig {
  return {
    apiBaseUrl: trimTrailingSlash(env.API_BASE_URL || "http://127.0.0.1:8000")
  };
}

async function readAuthenticatedUser(response: Response | { json: () => Promise<AuthenticatedUser> }): Promise<AuthOutcome> {
  try {
    const user = await response.json();
    return authenticatedAuthOutcome({ id: String(user.id), username: user.username });
  } catch {
    return unexpectedAuthErrorOutcome();
  }
}

export async function getCurrentUserFromCookieHeader(
  cookieHeader: string | undefined,
  config: ServerAuthConfig = getServerAuthConfig(),
  fetchImpl: FetchLike = fetch
): Promise<AuthOutcome> {
  if (!cookieHeader) {
    return unauthenticatedAuthOutcome();
  }

  try {
    const response = await fetchImpl(new URL("/api/auth/me", `${config.apiBaseUrl}/`).toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        cookie: cookieHeader
      }
    });

    if (response.ok) {
      return readAuthenticatedUser(response);
    }

    if (response.status === 401) {
      return unauthenticatedAuthOutcome();
    }

    return backendUnavailableAuthOutcome();
  } catch {
    return backendUnavailableAuthOutcome();
  }
}

export async function validateServerSession(
  cookieHeader: string | undefined,
  config: ServerAuthConfig = getServerAuthConfig(),
  fetchImpl: FetchLike = fetch
): Promise<AuthOutcome> {
  return getCurrentUserFromCookieHeader(cookieHeader, config, fetchImpl);
}
