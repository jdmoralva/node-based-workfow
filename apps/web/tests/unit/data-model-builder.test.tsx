import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreditModelerWorkbench } from "@/features/creditmodeler/CreditModelerWorkbench";
import { DataModelBuilder } from "@/features/creditmodeler/DataModelBuilder";
import { listConnections } from "@/features/creditmodeler/connections-client";
import { createDataModel, deleteDataModel, getDataModel, inspectConnectionSchema, listDataModels, testSavedDataModel, testUnsavedDataModel, updateDataModel } from "@/features/creditmodeler/data-models-client";

vi.mock("@/features/creditmodeler/connections-client", () => ({
  listConnections: vi.fn()
}));

vi.mock("@/features/creditmodeler/data-models-client", () => ({
  createDataModel: vi.fn(),
  deleteDataModel: vi.fn(),
  getDataModel: vi.fn(),
  inspectConnectionSchema: vi.fn(),
  listDataModels: vi.fn(),
  testSavedDataModel: vi.fn(),
  updateDataModel: vi.fn(),
  testUnsavedDataModel: vi.fn()
}));

const mockedCreateDataModel = vi.mocked(createDataModel);
const mockedDeleteDataModel = vi.mocked(deleteDataModel);
const mockedGetDataModel = vi.mocked(getDataModel);
const mockedListConnections = vi.mocked(listConnections);
const mockedInspectConnectionSchema = vi.mocked(inspectConnectionSchema);
const mockedListDataModels = vi.mocked(listDataModels);
const mockedTestSavedDataModel = vi.mocked(testSavedDataModel);
const mockedTestUnsavedDataModel = vi.mocked(testUnsavedDataModel);
const mockedUpdateDataModel = vi.mocked(updateDataModel);

const blankModel = {
  sources: [],
  fact_table: null,
  dimensions: [],
  relationships: [],
  business_rules: [],
  measures: [],
  metadata: {}
};

const savedModel = {
  id: "model_1",
  name: "Portfolio Star",
  description: "Reusable portfolio model",
  model: blankModel,
  test_status: "draft" as const,
  diagnostics_stale: false,
  last_tested_at: null,
  last_test_succeeded_at: null,
  last_test_failed_at: null,
  last_test_errors: [],
  last_test_warnings: [],
  created_at: "2026-07-18T10:00:00Z",
  updated_at: "2026-07-18T10:00:00Z"
};

const configuredModel = {
  sources: [{ connection_id: "conn_missing", alias: "portfolio", metadata: {} }],
  fact_table: {
    connection_id: "conn_missing",
    table: "loans",
    object_type: "table" as const,
    alias: "fact_loans",
    grain: null,
    primary_key: ["account_id"],
    metadata: {}
  },
  dimensions: [
    {
      id: "dim_customers",
      connection_id: "conn_missing",
      table: "customers",
      object_type: "table" as const,
      alias: "dim_customers",
      primary_key: ["customer_id"],
      metadata: {}
    }
  ],
  relationships: [
    {
      id: "rel_customers",
      dimension_id: "dim_customers",
      join_type: "left" as const,
      key_pairs: [{ fact_column: "customer_id", dimension_column: "customer_id" }],
      metadata: {}
    }
  ],
  business_rules: [{ id: "rule_1", name: "rule", expression: "upper(dim_customers.name)", output_type: "text" as const, metadata: {} }],
  measures: [],
  metadata: {}
};

describe("DataModelBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedListConnections.mockResolvedValue({
      connections: [
        {
          id: "conn_1",
          label: "Portfolio",
          driver: "sqlite",
          database_path: "portfolio.db",
          created_at: "2026-07-18T10:00:00Z",
          updated_at: "2026-07-18T10:00:00Z",
          last_tested_at: null
        }
      ]
    });
    mockedInspectConnectionSchema.mockResolvedValue({
      connection_id: "conn_1",
      connection_label: "Portfolio",
      objects: [
        {
          name: "loans",
          object_type: "table",
          columns: [
            { name: "account_id", declared_type: "TEXT", nullable: false, primary_key: true },
            { name: "customer_id", declared_type: "TEXT", nullable: true, primary_key: false }
          ]
        },
        { name: "customers", object_type: "table", columns: [{ name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: true }] }
      ]
    });
    mockedTestUnsavedDataModel.mockResolvedValue({
      succeeded: false,
      status: "draft",
      errors: [{ severity: "error", code: "missing_fact_table", message: "Select one fact table before testing this model.", location: null, stale: false }],
      warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: false }]
    });
    mockedCreateDataModel.mockResolvedValue(savedModel);
    mockedGetDataModel.mockResolvedValue(savedModel);
    mockedListDataModels.mockResolvedValue({ items: [] });
    mockedTestSavedDataModel.mockResolvedValue({ succeeded: true, status: "tested", errors: [], warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: false }] });
    mockedUpdateDataModel.mockResolvedValue({ ...savedModel, test_status: "stale", diagnostics_stale: true, last_test_warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: true }] });
    mockedDeleteDataModel.mockResolvedValue(undefined);
  });

  it("renders a blank builder and keeps Test clickable for incomplete drafts", async () => {
    const user = userEvent.setup();
    render(<DataModelBuilder />);

    expect(screen.getByRole("heading", { name: "New data model" })).toBeInTheDocument();
    expect(screen.getByLabelText("Data model name")).toHaveValue("");
    expect(await screen.findByRole("option", { name: "Portfolio" })).toHaveValue("conn_1");

    await user.click(screen.getByRole("button", { name: "Test" }));

    expect(mockedTestUnsavedDataModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: expect.objectContaining({ fact_table: null }) })
    );
    expect(await screen.findByText("Select one fact table before testing this model.")).toBeInTheDocument();
  });

  it("loads schema metadata when a source is selected", async () => {
    const user = userEvent.setup();
    render(<DataModelBuilder />);

    await user.selectOptions(await screen.findByLabelText("Source connection"), "conn_1");

    await waitFor(() => expect(screen.getByLabelText("Fact table")).toHaveValue("loans"));
    expect(mockedInspectConnectionSchema).toHaveBeenCalledWith("conn_1");
  });

  it("sends configured fact, dimension, relationship, and business rule for testing", async () => {
    const user = userEvent.setup();
    mockedTestUnsavedDataModel.mockResolvedValue({
      succeeded: true,
      status: "tested",
      errors: [],
      warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: false }]
    });
    render(<DataModelBuilder />);

    await user.type(screen.getByLabelText("Data model name"), "Portfolio Star");
    await user.selectOptions(await screen.findByLabelText("Source connection"), "conn_1");
    await user.selectOptions(await screen.findByLabelText("Fact table"), "loans");
    await user.selectOptions(screen.getByLabelText("Dimension table"), "customers");
    await user.type(screen.getByLabelText("Business rule expression"), "upper(dim_customers.customer_id)");
    await user.click(screen.getByRole("button", { name: "Test" }));

    await waitFor(() =>
      expect(mockedTestUnsavedDataModel).toHaveBeenLastCalledWith(
        expect.objectContaining({
          model: expect.objectContaining({
            fact_table: expect.objectContaining({ table: "loans", alias: "fact_loans" }),
            dimensions: [expect.objectContaining({ table: "customers", alias: "dim_customers" })],
            relationships: [expect.objectContaining({ join_type: "left" })],
            business_rules: [expect.objectContaining({ expression: "upper(dim_customers.customer_id)" })]
          })
        })
      )
    );
    expect(await screen.findByText("Data model test succeeded.")).toBeInTheDocument();
    expect(screen.getByText("Compilation only.")).toBeInTheDocument();
  });

  it("saves a draft and reports stale diagnostics after updating an existing model", async () => {
    const user = userEvent.setup();
    render(<DataModelBuilder />);

    await user.type(screen.getByLabelText("Data model name"), "Portfolio Star");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    expect(mockedCreateDataModel).toHaveBeenCalledWith(expect.objectContaining({ name: "Portfolio Star" }));
    expect(await screen.findByText("Data model saved.")).toBeInTheDocument();

    cleanup();
    mockedGetDataModel.mockResolvedValue({ ...savedModel, test_status: "tested", last_test_warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: false }] });
    render(<DataModelBuilder modelId="model_1" />);

    expect(await screen.findByRole("heading", { name: "Portfolio Star" })).toBeInTheDocument();
    expect(screen.getByLabelText("Data model name")).toHaveAttribute("readonly");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Edited");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockedUpdateDataModel).toHaveBeenCalledWith("model_1", expect.objectContaining({ name: "Portfolio Star", description: "Edited" }));
    expect(await screen.findByText("Diagnostics are stale after the latest save."));
  });

  it("tests and drops a saved model after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DataModelBuilder modelId="model_1" />);

    expect(await screen.findByRole("heading", { name: "Portfolio Star" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Test" }));
    expect(mockedTestSavedDataModel).toHaveBeenCalledWith("model_1");
    expect(await screen.findByText("Data model test succeeded."));

    await user.click(screen.getByRole("button", { name: "Drop" }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockedDeleteDataModel).toHaveBeenCalledWith("model_1");
    confirmSpy.mockRestore();
  });

  it("shows missing connection diagnostics, preserves configuration while replacing the source, and retests", async () => {
    const user = userEvent.setup();
    mockedGetDataModel.mockResolvedValue({
      ...savedModel,
      model: configuredModel,
      last_test_errors: [{ severity: "error", code: "missing_connection", message: "A referenced Connection is missing. Select a replacement source to repair this model.", location: { section: "sources", connection_id: "conn_missing" }, stale: false }]
    });
    mockedUpdateDataModel.mockResolvedValue({
      ...savedModel,
      model: {
        ...configuredModel,
        sources: [{ connection_id: "conn_1", alias: "portfolio", metadata: {} }],
        fact_table: { ...configuredModel.fact_table, connection_id: "conn_1" },
        dimensions: [{ ...configuredModel.dimensions[0], connection_id: "conn_1" }]
      },
      test_status: "untested",
      last_test_errors: []
    });
    render(<DataModelBuilder modelId="model_1" />);

    expect(await screen.findByText("A referenced Connection is missing. Select a replacement source to repair this model.")).toBeInTheDocument();
    expect(screen.getByText("Replace the missing source to keep table names, aliases, relationships, and business rules where possible.")).toBeInTheDocument();
    await user.selectOptions(await screen.findByLabelText("Replacement connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Repair Source" }));

    expect(mockedUpdateDataModel).toHaveBeenCalledWith(
      "model_1",
      expect.objectContaining({
        model: expect.objectContaining({
          sources: [expect.objectContaining({ connection_id: "conn_1", alias: "portfolio" })],
          fact_table: expect.objectContaining({ connection_id: "conn_1", table: "loans", alias: "fact_loans" }),
          dimensions: [expect.objectContaining({ connection_id: "conn_1", table: "customers", alias: "dim_customers" })],
          relationships: [expect.objectContaining({ key_pairs: [{ fact_column: "customer_id", dimension_column: "customer_id" }] })],
          business_rules: [expect.objectContaining({ expression: "upper(dim_customers.name)" })]
        })
      })
    );
    expect(await screen.findByText("Source repaired. Review preserved configuration before retesting.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Test" }));
    expect(mockedTestSavedDataModel).toHaveBeenCalledWith("model_1");
  });
});

describe("CreditModelerWorkbench data models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedListConnections.mockResolvedValue({ connections: [] });
    mockedListDataModels.mockResolvedValue({ items: [] });
  });

  it("opens the blank data model builder from top-level Data Models", async () => {
    const user = userEvent.setup();
    render(<CreditModelerWorkbench />);

    const tree = screen.getByTestId("workbench-tree");
    await user.click(within(tree).getByRole("button", { name: "Data Models" }));

    expect(await screen.findByRole("heading", { name: "New data model" })).toBeInTheDocument();
  });

  it("loads saved data models into a dynamic auto-expanded submenu", async () => {
    const user = userEvent.setup();
    mockedListDataModels.mockResolvedValue({ items: [savedModel] });
    render(<CreditModelerWorkbench />);

    const dataModelsToggle = await screen.findByRole("button", { name: "Data Models submenu" });
    expect(dataModelsToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("button", { name: "Origination" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Portfolio Star" }));
    expect(mockedGetDataModel).toHaveBeenCalledWith("model_1");
    expect(await screen.findByRole("heading", { name: "Portfolio Star" })).toBeInTheDocument();
  });

  it("upserts saved models after save and removes them after drop", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedListDataModels.mockResolvedValue({ items: [] });
    render(<CreditModelerWorkbench />);

    await user.click(within(screen.getByTestId("workbench-tree")).getByRole("button", { name: "Data Models" }));
    await user.type(await screen.findByLabelText("Data model name"), "Portfolio Star");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    expect(await screen.findByRole("button", { name: "Portfolio Star" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Portfolio Star" }));
    await user.click(await screen.findByRole("button", { name: "Drop" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Portfolio Star" })).not.toBeInTheDocument());
    vi.restoreAllMocks();
  });
});
