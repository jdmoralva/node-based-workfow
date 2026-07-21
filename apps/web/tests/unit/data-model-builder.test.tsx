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

    await user.click(screen.getByRole("button", { name: "Test model" }));

    expect(mockedTestUnsavedDataModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: expect.objectContaining({ fact_table: null }) })
    );
    expect(await screen.findByText("Select one fact table before testing this model.")).toBeInTheDocument();
  });

  it("loads schema metadata but waits for an explicit table selection", async () => {
    const user = userEvent.setup();
    render(<DataModelBuilder />);

    await user.selectOptions(await screen.findByLabelText("New source connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Add source connection" }));
    await user.selectOptions(screen.getByLabelText("Fact source connection"), "conn_1");

    expect(await screen.findByRole("option", { name: "loans · table" })).toBeInTheDocument();
    expect(screen.getByLabelText("Fact table or view")).toHaveValue("");
    expect(mockedInspectConnectionSchema).toHaveBeenCalledWith("conn_1");
  });

  it("retries schema metadata after a transient failure", async () => {
    const user = userEvent.setup();
    mockedInspectConnectionSchema.mockRejectedValueOnce(new Error("Connection database is not available for data modeling.")).mockResolvedValueOnce({
      connection_id: "conn_1",
      connection_label: "Portfolio",
      objects: [{ name: "loans", object_type: "table", columns: [] }]
    });
    render(<DataModelBuilder />);

    await user.selectOptions(await screen.findByLabelText("New source connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Add source connection" }));
    expect(await screen.findByText("Connection database is not available for data modeling.")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Fact source connection"), "conn_1");
    expect(screen.getByLabelText("Fact table or view")).toBeDisabled();
    expect(screen.getByRole("option", { name: "Schema unavailable" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry fact schema for Portfolio" }));

    await waitFor(() => expect(mockedInspectConnectionSchema).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("option", { name: "loans · table" })).toBeInTheDocument();
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
    await user.selectOptions(await screen.findByLabelText("New source connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Add source connection" }));
    await user.selectOptions(screen.getByLabelText("Fact source connection"), "conn_1");
    await user.selectOptions(screen.getByLabelText("Fact table or view"), "loans");
    await user.click(screen.getByRole("button", { name: "Add dimension" }));
    await user.selectOptions(screen.getByLabelText("Dimension 1 table or view"), "customers");
    await user.click(screen.getByRole("button", { name: "Add key pair for dim_customers" }));
    await user.selectOptions(screen.getByLabelText("Relationship 1 fact column 1"), "customer_id");
    await user.selectOptions(screen.getByLabelText("Relationship 1 dimension column 1"), "customer_id");
    await user.click(screen.getByRole("button", { name: "Add business rule" }));
    await user.type(screen.getByLabelText("Business rule 1 expression"), "upper(dim_customers.customer_id)");
    await user.click(screen.getByRole("button", { name: "Test model" }));

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

  it("invalidates draft-only test results after the visible definition changes", async () => {
    const user = userEvent.setup();
    render(<DataModelBuilder />);

    await user.click(screen.getByRole("button", { name: "Test model" }));
    expect(await screen.findByText(/Draft test results are not persisted/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("New source connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Add source connection" }));

    expect(screen.queryByText(/Draft test results are not persisted/)).not.toBeInTheDocument();
    expect(screen.queryByText("Select one fact table before testing this model.")).not.toBeInTheDocument();
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

  it("preserves edits made while a save request is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate: ((model: typeof savedModel) => void) | undefined;
    mockedCreateDataModel.mockImplementation(
      () => new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );
    render(<DataModelBuilder />);

    await user.type(screen.getByLabelText("Data model name"), "Portfolio Star");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(screen.getByLabelText("Data model name")).toHaveAttribute("readonly");
    await user.type(screen.getByLabelText("Description"), "Added while saving");
    resolveCreate?.(savedModel);

    expect(await screen.findByText("Data model saved. Newer edits remain unsaved.")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue("Added while saving");
  });

  it("tests and drops a saved model after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<DataModelBuilder modelId="model_1" />);

    expect(await screen.findByRole("heading", { name: "Portfolio Star" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Test model" }));
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
    expect(screen.getByText("Choose a replacement to preserve tables, aliases, relationships, and rules where possible.")).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Test model" }));
    expect(mockedTestSavedDataModel).toHaveBeenCalledWith("model_1");
  });

  it("preserves edits made while a source repair is pending", async () => {
    const user = userEvent.setup();
    let resolveRepair: ((model: typeof savedModel) => void) | undefined;
    mockedGetDataModel.mockResolvedValue({
      ...savedModel,
      model: configuredModel,
      last_test_errors: [{ severity: "error", code: "missing_connection", message: "Missing source.", location: { section: "sources", connection_id: "conn_missing" }, stale: false }]
    });
    mockedUpdateDataModel.mockImplementation(
      () => new Promise((resolve) => {
        resolveRepair = resolve;
      })
    );
    render(<DataModelBuilder modelId="model_1" />);

    await user.selectOptions(await screen.findByLabelText("Replacement connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Repair Source" }));
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Edited during repair");
    resolveRepair?.({
      ...savedModel,
      model: replaceConfiguredConnection(configuredModel, "conn_1"),
      last_test_errors: []
    });

    expect(await screen.findByText("Source repaired. Newer edits remain unsaved; review the preserved configuration before retesting.")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toHaveValue("Edited during repair");
  });

  it("builds a multi-source model with repeated editors and composite relationship keys", async () => {
    const user = userEvent.setup();
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
        },
        {
          id: "conn_2",
          label: "Customer Master",
          driver: "sqlite",
          database_path: "customers.db",
          created_at: "2026-07-18T10:00:00Z",
          updated_at: "2026-07-18T10:00:00Z",
          last_tested_at: null
        }
      ]
    });
    mockedInspectConnectionSchema.mockImplementation(async (connectionId) =>
      connectionId === "conn_1"
        ? {
            connection_id: "conn_1",
            connection_label: "Portfolio",
            objects: [
              {
                name: "loans",
                object_type: "table",
                columns: [
                  { name: "account_id", declared_type: "TEXT", nullable: false, primary_key: true },
                  { name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: false },
                  { name: "segment_id", declared_type: "TEXT", nullable: false, primary_key: false }
                ]
              }
            ]
          }
        : {
            connection_id: "conn_2",
            connection_label: "Customer Master",
            objects: [
              {
                name: "customers",
                object_type: "view",
                columns: [
                  { name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: true },
                  { name: "segment_id", declared_type: "TEXT", nullable: false, primary_key: true },
                  { name: "name", declared_type: "TEXT", nullable: true, primary_key: false }
                ]
              }
            ]
          }
    );
    mockedTestUnsavedDataModel.mockResolvedValue({ succeeded: true, status: "tested", errors: [], warnings: [] });
    render(<DataModelBuilder />);

    await user.type(screen.getByLabelText("Data model name"), "Portfolio Star");
    await user.selectOptions(await screen.findByLabelText("New source connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Add source connection" }));
    await user.clear(screen.getByLabelText("Source alias 1"));
    await user.type(screen.getByLabelText("Source alias 1"), "portfolio");
    await user.selectOptions(screen.getByLabelText("New source connection"), "conn_2");
    await user.click(screen.getByRole("button", { name: "Add source connection" }));
    await user.clear(screen.getByLabelText("Source alias 2"));
    await user.type(screen.getByLabelText("Source alias 2"), "customer");

    await user.selectOptions(screen.getByLabelText("Fact source connection"), "conn_1");
    await user.selectOptions(screen.getByLabelText("Fact table or view"), "loans");
    await user.selectOptions(screen.getByLabelText("Fact primary key columns"), ["account_id"]);

    await user.click(screen.getByRole("button", { name: "Add dimension" }));
    await user.selectOptions(screen.getByLabelText("Dimension 1 source connection"), "conn_2");
    await user.selectOptions(screen.getByLabelText("Dimension 1 table or view"), "customers");
    await user.clear(screen.getByLabelText("Dimension 1 alias"));
    await user.type(screen.getByLabelText("Dimension 1 alias"), "dim_customer");
    await user.selectOptions(screen.getByLabelText("Dimension 1 primary key columns"), ["customer_id", "segment_id"]);

    await user.click(screen.getByRole("button", { name: "Add key pair for dim_customer" }));
    await user.selectOptions(screen.getByLabelText("Relationship 1 fact column 1"), "customer_id");
    await user.selectOptions(screen.getByLabelText("Relationship 1 dimension column 1"), "customer_id");
    await user.click(screen.getByRole("button", { name: "Add key pair for dim_customer" }));
    await user.selectOptions(screen.getByLabelText("Relationship 1 fact column 2"), "segment_id");
    await user.selectOptions(screen.getByLabelText("Relationship 1 dimension column 2"), "segment_id");

    await user.click(screen.getByRole("button", { name: "Add business rule" }));
    await user.clear(screen.getByLabelText("Business rule 1 name"));
    await user.type(screen.getByLabelText("Business rule 1 name"), "customer_name");
    await user.type(screen.getByLabelText("Business rule 1 expression"), "upper(dim_customer.name)");
    await user.selectOptions(screen.getByLabelText("Business rule 1 output type"), "text");
    await user.click(screen.getByRole("button", { name: "Test model" }));

    await waitFor(() =>
      expect(mockedTestUnsavedDataModel).toHaveBeenCalledWith({
        model: expect.objectContaining({
          sources: [
            expect.objectContaining({ connection_id: "conn_1", alias: "portfolio" }),
            expect.objectContaining({ connection_id: "conn_2", alias: "customer" })
          ],
          fact_table: expect.objectContaining({ connection_id: "conn_1", table: "loans", primary_key: ["account_id"] }),
          dimensions: [
            expect.objectContaining({
              id: expect.stringMatching(/^dim_/),
              connection_id: "conn_2",
              table: "customers",
              object_type: "view",
              alias: "dim_customer",
              primary_key: ["customer_id", "segment_id"]
            })
          ],
          relationships: [
            expect.objectContaining({
              id: expect.stringMatching(/^rel_/),
              join_type: "left",
              key_pairs: [
                { fact_column: "customer_id", dimension_column: "customer_id" },
                { fact_column: "segment_id", dimension_column: "segment_id" }
              ]
            })
          ],
          business_rules: [
            expect.objectContaining({ id: expect.stringMatching(/^rule_/), name: "customer_name", expression: "upper(dim_customer.name)", output_type: "text" })
          ]
        })
      })
    );

    const testedModel = mockedTestUnsavedDataModel.mock.calls.at(-1)?.[0].model;
    mockedCreateDataModel.mockResolvedValue({ ...savedModel, model: testedModel ?? blankModel });
    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    expect(mockedCreateDataModel).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Portfolio Star",
        model: expect.objectContaining({
          dimensions: [expect.objectContaining({ id: testedModel?.dimensions[0].id })],
          relationships: [expect.objectContaining({ id: testedModel?.relationships[0].id })],
          business_rules: [expect.objectContaining({ id: testedModel?.business_rules[0].id })]
        })
      })
    );
    expect(await screen.findByText("Name locked")).toBeInTheDocument();
  }, 15000);

  it("preserves compatible relationship keys when a dimension table changes", async () => {
    const user = userEvent.setup();
    mockedInspectConnectionSchema.mockResolvedValue({
      connection_id: "conn_1",
      connection_label: "Portfolio",
      objects: [
        {
          name: "loans",
          object_type: "table",
          columns: [
            { name: "account_id", declared_type: "TEXT", nullable: false, primary_key: true },
            { name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: false }
          ]
        },
        { name: "customers", object_type: "table", columns: [{ name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: true }] },
        { name: "customer_archive", object_type: "view", columns: [{ name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: true }] }
      ]
    });
    render(<DataModelBuilder />);

    await user.selectOptions(await screen.findByLabelText("New source connection"), "conn_1");
    await user.click(screen.getByRole("button", { name: "Add source connection" }));
    await user.selectOptions(screen.getByLabelText("Fact source connection"), "conn_1");
    await user.selectOptions(screen.getByLabelText("Fact table or view"), "loans");
    await user.click(screen.getByRole("button", { name: "Add dimension" }));
    await user.selectOptions(screen.getByLabelText("Dimension 1 table or view"), "customers");
    await user.click(screen.getByRole("button", { name: "Add key pair for dim_customers" }));
    await user.selectOptions(screen.getByLabelText("Relationship 1 fact column 1"), "customer_id");
    await user.selectOptions(screen.getByLabelText("Relationship 1 dimension column 1"), "customer_id");

    await user.selectOptions(screen.getByLabelText("Dimension 1 table or view"), "customer_archive");

    expect(screen.getByLabelText("Relationship 1 fact column 1")).toHaveValue("customer_id");
    expect(screen.getByLabelText("Relationship 1 dimension column 1")).toHaveValue("customer_id");
  });

  it("shows a safe retry state when saved-model hydration fails", async () => {
    mockedGetDataModel.mockRejectedValue(new Error("network"));

    render(<DataModelBuilder modelId="model_1" />);

    expect(await screen.findByRole("heading", { name: "Data model could not be loaded" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry loading data model" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drop" })).not.toBeInTheDocument();
  });

  it("tests the visible draft instead of the persisted model after an existing model is edited", async () => {
    const user = userEvent.setup();
    mockedGetDataModel.mockResolvedValue({ ...savedModel, model: configuredModel });
    render(<DataModelBuilder modelId="model_1" />);

    expect(await screen.findByRole("heading", { name: "Portfolio Star" })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Edited but not saved");
    await user.click(screen.getByRole("button", { name: "Test model" }));

    expect(mockedTestUnsavedDataModel).toHaveBeenCalledWith({ model: configuredModel });
    expect(mockedTestSavedDataModel).not.toHaveBeenCalled();
    expect(await screen.findByText(/Draft test results are not persisted/)).toBeInTheDocument();
  });

  it("hydrates every saved dimension and cascades dimension alias edits into business rules", async () => {
    const user = userEvent.setup();
    const rolePlayingModel = {
      ...configuredModel,
      dimensions: [
        configuredModel.dimensions[0],
        { ...configuredModel.dimensions[0], id: "dim_guarantor", alias: "dim_guarantor" }
      ],
      relationships: [
        configuredModel.relationships[0],
        { ...configuredModel.relationships[0], id: "rel_guarantor", dimension_id: "dim_guarantor" }
      ],
      business_rules: [{ ...configuredModel.business_rules[0], expression: "coalesce(dim_customers.name, dim_guarantor.name)" }]
    };
    mockedGetDataModel.mockResolvedValue({ ...savedModel, model: rolePlayingModel });
    render(<DataModelBuilder modelId="model_1" />);

    expect(await screen.findByLabelText("Dimension 2 alias")).toHaveValue("dim_guarantor");
    await user.clear(screen.getByLabelText("Dimension 1 alias"));
    await user.type(screen.getByLabelText("Dimension 1 alias"), "dim_borrower");

    expect(screen.getByLabelText("Business rule 1 expression")).toHaveValue("coalesce(dim_borrower.name, dim_guarantor.name)");
  });
});

describe("CreditModelerWorkbench data models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateDataModel.mockResolvedValue(savedModel);
    mockedDeleteDataModel.mockResolvedValue(undefined);
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
    await waitFor(() => expect(dataModelsToggle).toHaveAttribute("aria-expanded", "true"));
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
    await user.click(screen.getByRole("button", { name: "Drop" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Portfolio Star" })).not.toBeInTheDocument());
    vi.restoreAllMocks();
  });

  it("keeps a newly saved model when the initial model list resolves late", async () => {
    const user = userEvent.setup();
    let resolveList: ((response: { items: [] }) => void) | undefined;
    mockedListDataModels.mockImplementation(
      () => new Promise((resolve) => {
        resolveList = resolve;
      })
    );
    render(<CreditModelerWorkbench />);

    await user.click(within(screen.getByTestId("workbench-tree")).getByRole("button", { name: "Data Models" }));
    await user.type(await screen.findByLabelText("Data model name"), "Portfolio Star");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(await screen.findByRole("button", { name: "Portfolio Star" })).toBeInTheDocument();

    resolveList?.({ items: [] });

    await waitFor(() => expect(screen.getByRole("button", { name: "Portfolio Star" })).toBeInTheDocument());
  });
});

function replaceConfiguredConnection(model: typeof configuredModel, connectionId: string): typeof configuredModel {
  return {
    ...model,
    sources: model.sources.map((source) => ({ ...source, connection_id: connectionId })),
    fact_table: { ...model.fact_table, connection_id: connectionId },
    dimensions: model.dimensions.map((dimension) => ({ ...dimension, connection_id: connectionId }))
  };
}
