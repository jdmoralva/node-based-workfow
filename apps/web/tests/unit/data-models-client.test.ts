import { describe, expect, it, vi } from "vitest";

import { createDataModel, deleteDataModel, getDataModel, inspectConnectionSchema, listDataModels, testSavedDataModel, testUnsavedDataModel, updateDataModel } from "@/features/creditmodeler/data-models-client";
import type { DataModelDefinition } from "@/features/creditmodeler/data-model-types";

const blankModel: DataModelDefinition = {
  schema_version: 2,
  sources: [],
  fact_table: null,
  dimensions: [],
  relationships: [],
  business_rules: [],
  measures: [],
  metadata: {}
};

describe("data-models client", () => {
  it("uses a safe API detail when a request fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ detail: "A data model with this name already exists." })
    });

    await expect(createDataModel({ name: "Portfolio Star", model: blankModel }, { apiBaseUrl: "" }, fetchImpl)).rejects.toThrow(
      "A data model with this name already exists."
    );
  });

  it("inspects connection schema with credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ connection_id: "conn_1", connection_label: "Portfolio", objects: [] })
    });

    const result = await inspectConnectionSchema("conn_1", { apiBaseUrl: "https://api.example.test" }, fetchImpl);

    expect(result.connection_id).toBe("conn_1");
    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/api/data-models/connections/conn_1/schema", {
      credentials: "include",
      method: "GET",
      headers: {}
    });
  });

  it("tests unsaved data models with a JSON payload", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ succeeded: false, status: "draft", errors: [], warnings: [] })
    });

    await testUnsavedDataModel({ model: blankModel }, { apiBaseUrl: "" }, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("/api/data-models/test", {
      credentials: "include",
      method: "POST",
      body: JSON.stringify({ model: blankModel }),
      headers: { "Content-Type": "application/json" }
    });
  });

  it("lists saved data models with an optional single status filter", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ items: [] }) });

    await listDataModels("draft", { apiBaseUrl: "https://api.example.test" }, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith("https://api.example.test/api/data-models?status=draft", {
      credentials: "include",
      method: "GET",
      headers: {}
    });
  });

  it("creates, reads, updates, tests, and deletes saved data models", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "model_1" }) });

    await createDataModel({ name: "Portfolio Star", description: null, model: blankModel }, { apiBaseUrl: "" }, fetchImpl);
    await getDataModel("model_1", { apiBaseUrl: "" }, fetchImpl);
    await updateDataModel("model_1", { name: "Portfolio Star", description: "Updated", model: blankModel }, { apiBaseUrl: "" }, fetchImpl);
    await testSavedDataModel("model_1", { apiBaseUrl: "" }, fetchImpl);
    await deleteDataModel("model_1", { apiBaseUrl: "" }, fetchImpl);

    expect(fetchImpl).toHaveBeenNthCalledWith(1, "/api/data-models", expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Portfolio Star", description: null, model: blankModel }) }));
    expect(fetchImpl).toHaveBeenNthCalledWith(2, "/api/data-models/model_1", expect.objectContaining({ method: "GET" }));
    expect(fetchImpl).toHaveBeenNthCalledWith(3, "/api/data-models/model_1", expect.objectContaining({ method: "PUT" }));
    expect(fetchImpl).toHaveBeenNthCalledWith(4, "/api/data-models/model_1/test", expect.objectContaining({ method: "POST" }));
    expect(fetchImpl).toHaveBeenNthCalledWith(5, "/api/data-models/model_1", expect.objectContaining({ method: "DELETE" }));
  });
});
