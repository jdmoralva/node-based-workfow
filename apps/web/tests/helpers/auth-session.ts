import type { APIRequestContext } from "@playwright/test";

type AuthSessionEnv = Record<string, string | undefined>;

export type AuthSessionTestConfig = {
  apiBaseUrl: string;
  sessionCookieName: string;
  username: string;
  password: string;
  loginPath: "/api/auth/login";
  logoutPath: "/api/auth/logout";
  currentUserPath: "/api/auth/me";
};

export type AuthSessionCredentials = Pick<AuthSessionTestConfig, "username" | "password">;

const DEFAULT_BROWSER_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_SESSION_COOKIE_NAME = "rv_session";
const DEFAULT_USERNAME = "analyst";
const DEFAULT_PASSWORD = "correct-horse-battery-staple";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function readAuthSessionTestConfig(env: AuthSessionEnv = process.env): AuthSessionTestConfig {
  const apiBaseUrl = trimTrailingSlash(
    env.NEXT_PUBLIC_API_BASE_URL || env.API_BASE_URL || DEFAULT_BROWSER_BASE_URL
  );

  return {
    apiBaseUrl,
    sessionCookieName: env.AUTH_SESSION_COOKIE_NAME || DEFAULT_SESSION_COOKIE_NAME,
    username: env.E2E_AUTH_USERNAME || DEFAULT_USERNAME,
    password: env.E2E_AUTH_PASSWORD || DEFAULT_PASSWORD,
    loginPath: "/api/auth/login",
    logoutPath: "/api/auth/logout",
    currentUserPath: "/api/auth/me"
  };
}

export function readBackendAuthSessionTestConfig(env: AuthSessionEnv = process.env): AuthSessionTestConfig {
  const config = readAuthSessionTestConfig(env);

  return {
    ...config,
    apiBaseUrl: trimTrailingSlash(env.API_BASE_URL || DEFAULT_API_BASE_URL)
  };
}

export function resolveAuthApiUrl(
  path: string,
  config: Pick<AuthSessionTestConfig, "apiBaseUrl"> = readAuthSessionTestConfig()
): string {
  return new URL(path, `${config.apiBaseUrl}/`).toString();
}

export async function loginWithAuthSession(
  request: APIRequestContext,
  credentials: Partial<AuthSessionCredentials> = {},
  config: AuthSessionTestConfig = readBackendAuthSessionTestConfig()
): Promise<void> {
  const response = await request.post(resolveAuthApiUrl(config.loginPath, config), {
    data: {
      username: credentials.username || config.username,
      password: credentials.password || config.password
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create auth session for tests: ${response.status()} ${response.statusText()}`);
  }
}

export async function logoutAuthSession(
  request: APIRequestContext,
  config: AuthSessionTestConfig = readBackendAuthSessionTestConfig()
): Promise<void> {
  const response = await request.post(resolveAuthApiUrl(config.logoutPath, config));

  if (!response.ok()) {
    throw new Error(`Failed to clear auth session for tests: ${response.status()} ${response.statusText()}`);
  }
}

export async function createAuthenticatedStorageState(
  request: APIRequestContext,
  credentials: Partial<AuthSessionCredentials> = {},
  config: AuthSessionTestConfig = readBackendAuthSessionTestConfig()
) {
  await loginWithAuthSession(request, credentials, config);
  return request.storageState();
}
