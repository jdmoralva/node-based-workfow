import type { DataModelConnectionSchemaResponse, DataModelCreatePayload, DataModelStatus, DataModelTestPayload, DataModelTestResponse, DataModelUpdatePayload, SavedDataModel, SavedDataModelsResponse } from "@/features/creditmodeler/data-model-types";

type DataModelsClientConfig = {
  apiBaseUrl: string;
};

type FetchLike = typeof fetch;

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getDataModelsClientConfig(env: Record<string, string | undefined> = process.env): DataModelsClientConfig {
  return {
    apiBaseUrl: trimTrailingSlash(env.NEXT_PUBLIC_API_BASE_URL || "")
  };
}

function resolveDataModelsUrl(path: string, config: DataModelsClientConfig): string {
  return config.apiBaseUrl ? new URL(path, `${config.apiBaseUrl}/`).toString() : path;
}

async function requestJson<T>(path: string, init: RequestInit, config: DataModelsClientConfig, fetchImpl: FetchLike): Promise<T> {
  const response = await fetchImpl(resolveDataModelsUrl(path, config), {
    credentials: "include",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json() as { detail?: unknown }).detail;
    } catch {
      detail = null;
    }
    throw new Error(typeof detail === "string" && detail.trim() ? detail : "Data model request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listDataModels(
  status?: DataModelStatus,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedDataModelsResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson(`/api/data-models${query}`, { method: "GET" }, config, fetchImpl);
}

export function createDataModel(
  payload: DataModelCreatePayload,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedDataModel> {
  return requestJson("/api/data-models", { method: "POST", body: JSON.stringify(payload) }, config, fetchImpl);
}

export function getDataModel(
  modelId: string,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedDataModel> {
  return requestJson(`/api/data-models/${modelId}`, { method: "GET" }, config, fetchImpl);
}

export function updateDataModel(
  modelId: string,
  payload: DataModelUpdatePayload,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<SavedDataModel> {
  return requestJson(`/api/data-models/${modelId}`, { method: "PUT", body: JSON.stringify(payload) }, config, fetchImpl);
}

export function deleteDataModel(
  modelId: string,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<void> {
  return requestJson(`/api/data-models/${modelId}`, { method: "DELETE" }, config, fetchImpl);
}

export function testSavedDataModel(
  modelId: string,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<DataModelTestResponse> {
  return requestJson(`/api/data-models/${modelId}/test`, { method: "POST" }, config, fetchImpl);
}

export function inspectConnectionSchema(
  connectionId: string,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<DataModelConnectionSchemaResponse> {
  return requestJson(`/api/data-models/connections/${connectionId}/schema`, { method: "GET" }, config, fetchImpl);
}

export function testUnsavedDataModel(
  payload: DataModelTestPayload,
  config: DataModelsClientConfig = getDataModelsClientConfig(),
  fetchImpl: FetchLike = fetch
): Promise<DataModelTestResponse> {
  return requestJson("/api/data-models/test", { method: "POST", body: JSON.stringify(payload) }, config, fetchImpl);
}
