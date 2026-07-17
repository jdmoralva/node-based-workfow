import type {
  ConnectionCreatePayload,
  ConnectionTestPayload,
  ConnectionTestResult,
  ConnectionUpdatePayload,
  DatabaseOptionsResponse,
  SavedConnection,
  SavedConnectionTestResult,
  SavedConnectionsResponse
} from "@/features/creditmodeler/connection-types";

type ConnectionsClientConfig = {
  apiBaseUrl: string;
};

type FetchLike = typeof fetch;

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getConnectionsClientConfig(env: Record<string, string | undefined> = process.env): ConnectionsClientConfig {
  return {
    apiBaseUrl: trimTrailingSlash(env.NEXT_PUBLIC_API_BASE_URL || "")
  };
}

function resolveConnectionsUrl(path: string, config: ConnectionsClientConfig): string {
  return config.apiBaseUrl ? new URL(path, `${config.apiBaseUrl}/`).toString() : path;
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  config: ConnectionsClientConfig,
  fetchImpl: FetchLike
): Promise<T> {
  const response = await fetchImpl(resolveConnectionsUrl(path, config), {
    credentials: "include",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error("Connection request failed.");
  }

  return response.json() as Promise<T>;
}

async function requestEmpty(path: string, init: RequestInit, config: ConnectionsClientConfig, fetchImpl: FetchLike): Promise<void> {
  const response = await fetchImpl(resolveConnectionsUrl(path, config), {
    credentials: "include",
    ...init
  });

  if (!response.ok) {
    throw new Error("Connection request failed.");
  }
}

export function listDatabaseOptions(
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<DatabaseOptionsResponse> {
  return requestJson("/api/connections/databases", { method: "GET" }, config, fetchImpl);
}

export function listConnections(
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedConnectionsResponse> {
  return requestJson("/api/connections", { method: "GET" }, config, fetchImpl);
}

export function createConnection(
  payload: ConnectionCreatePayload,
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedConnection> {
  return requestJson("/api/connections", { method: "POST", body: JSON.stringify(payload) }, config, fetchImpl);
}

export function readConnection(
  connectionId: string,
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedConnection> {
  return requestJson(`/api/connections/${connectionId}`, { method: "GET" }, config, fetchImpl);
}

export function updateConnection(
  connectionId: string,
  payload: ConnectionUpdatePayload,
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedConnection> {
  return requestJson(`/api/connections/${connectionId}`, { method: "PUT", body: JSON.stringify(payload) }, config, fetchImpl);
}

export function deleteConnection(
  connectionId: string,
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<void> {
  return requestEmpty(`/api/connections/${connectionId}`, { method: "DELETE" }, config, fetchImpl);
}

export function testUnsavedConnection(
  payload: ConnectionTestPayload,
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<ConnectionTestResult> {
  return requestJson("/api/connections/test", { method: "POST", body: JSON.stringify(payload) }, config, fetchImpl);
}

export function testSavedConnection(
  connectionId: string,
  config: ConnectionsClientConfig = getConnectionsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedConnectionTestResult> {
  return requestJson(`/api/connections/${connectionId}/test`, { method: "POST" }, config, fetchImpl);
}
