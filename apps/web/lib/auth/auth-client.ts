import {
  authenticatedAuthOutcome,
  backendUnavailableAuthOutcome,
  invalidCredentialsAuthOutcome,
  unauthenticatedAuthOutcome,
  unexpectedAuthErrorOutcome,
  type AuthOutcome,
  type AuthenticatedUser
} from "@/lib/auth/auth-types";

type BrowserAuthConfig = {
  apiBaseUrl: string;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type FetchLike = typeof fetch;

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getBrowserAuthConfig(env: Record<string, string | undefined> = process.env): BrowserAuthConfig {
  return {
    apiBaseUrl: trimTrailingSlash(env.NEXT_PUBLIC_API_BASE_URL || "")
  };
}

function resolveAuthUrl(path: string, config: BrowserAuthConfig): string {
  return config.apiBaseUrl ? new URL(path, `${config.apiBaseUrl}/`).toString() : path;
}

async function readAuthenticatedUser(response: Response | { json: () => Promise<AuthenticatedUser> }): Promise<AuthOutcome> {
  try {
    const user = await response.json();
    return authenticatedAuthOutcome({ id: String(user.id), username: user.username });
  } catch {
    return unexpectedAuthErrorOutcome();
  }
}

export async function login(
  credentials: LoginCredentials,
  config: BrowserAuthConfig = getBrowserAuthConfig(),
  fetchImpl: FetchLike = fetch
): Promise<AuthOutcome> {
  try {
    const response = await fetchImpl(resolveAuthUrl("/api/auth/login", config), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });

    if (response.ok) {
      return getCurrentUser(config, fetchImpl);
    }

    if (response.status === 401) {
      return invalidCredentialsAuthOutcome();
    }

    return backendUnavailableAuthOutcome();
  } catch {
    return backendUnavailableAuthOutcome();
  }
}

export async function getCurrentUser(
  config: BrowserAuthConfig = getBrowserAuthConfig(),
  fetchImpl: FetchLike = fetch
): Promise<AuthOutcome> {
  try {
    const response = await fetchImpl(resolveAuthUrl("/api/auth/me", config), {
      method: "GET",
      credentials: "include"
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

export async function logout(
  config: BrowserAuthConfig = getBrowserAuthConfig(),
  fetchImpl: FetchLike = fetch
): Promise<AuthOutcome> {
  try {
    const response = await fetchImpl(resolveAuthUrl("/api/auth/logout", config), {
      method: "POST",
      credentials: "include"
    });

    if (response.ok || response.status === 401) {
      return unauthenticatedAuthOutcome();
    }

    return backendUnavailableAuthOutcome();
  } catch {
    return backendUnavailableAuthOutcome();
  }
}
