import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionBuilder } from "@/features/creditmodeler/ConnectionBuilder";
import { CreditModelerWorkbench } from "@/features/creditmodeler/CreditModelerWorkbench";
import {
  createConnection,
  deleteConnection,
  listConnections,
  listDatabaseOptions,
  readConnection,
  testSavedConnection,
  testUnsavedConnection,
  updateConnection
} from "@/features/creditmodeler/connections-client";
import { listDataModels } from "@/features/creditmodeler/data-models-client";

vi.mock("@/features/creditmodeler/connections-client", () => ({
  createConnection: vi.fn(),
  deleteConnection: vi.fn(),
  listConnections: vi.fn(),
  listDatabaseOptions: vi.fn(),
  readConnection: vi.fn(),
  testSavedConnection: vi.fn(),
  testUnsavedConnection: vi.fn(),
  updateConnection: vi.fn()
}));

vi.mock("@/features/creditmodeler/data-models-client", () => ({
  listDataModels: vi.fn()
}));

const mockedListDatabaseOptions = vi.mocked(listDatabaseOptions);
const mockedListConnections = vi.mocked(listConnections);
const mockedCreateConnection = vi.mocked(createConnection);
const mockedDeleteConnection = vi.mocked(deleteConnection);
const mockedReadConnection = vi.mocked(readConnection);
const mockedTestSavedConnection = vi.mocked(testSavedConnection);
const mockedTestUnsavedConnection = vi.mocked(testUnsavedConnection);
const mockedUpdateConnection = vi.mocked(updateConnection);
const mockedListDataModels = vi.mocked(listDataModels);

describe("ConnectionBuilder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockedListDatabaseOptions.mockResolvedValue({ databases: [{ value: "risk/loan_book.sqlite", label: "risk/loan_book" }] });
    mockedTestUnsavedConnection.mockResolvedValue({ ok: true, message: "Connection test succeeded." });
    mockedCreateConnection.mockResolvedValue({
      id: "conn_1",
      label: "Loan Book",
      driver: "sqlite",
      database_path: "risk/loan_book.sqlite",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_tested_at: null
    });
    mockedReadConnection.mockResolvedValue({
      id: "conn_1",
      label: "Loan Book",
      driver: "sqlite",
      database_path: "risk/loan_book.sqlite",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_tested_at: null
    });
    mockedTestSavedConnection.mockResolvedValue({
      ok: true,
      message: "Connection test succeeded.",
      connection: {
        id: "conn_1",
        label: "Loan Book",
        driver: "sqlite",
        database_path: "risk/loan_book.sqlite",
        created_at: "2026-07-16T10:00:00Z",
        updated_at: "2026-07-16T10:00:00Z",
        last_tested_at: "2026-07-16T10:05:00Z"
      }
    });
    mockedUpdateConnection.mockResolvedValue({
      id: "conn_1",
      label: "Loan Book",
      driver: "sqlite",
      database_path: "portfolio.db",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:02:00Z",
      last_tested_at: null
    });
    mockedDeleteConnection.mockResolvedValue();
  });

  it("renders a blank builder and loads database options", async () => {
    render(<ConnectionBuilder onConnectionSaved={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "New database connection" })).toBeInTheDocument();
    expect(screen.getByLabelText("Connection label")).toHaveValue("");
    expect(screen.getByLabelText("Database type")).toHaveValue("SQLite");
    expect(await screen.findByRole("option", { name: "risk/loan_book" })).toHaveValue("risk/loan_book.sqlite");
  });

  it("shows an empty discovery state", async () => {
    mockedListDatabaseOptions.mockResolvedValue({ databases: [] });

    render(<ConnectionBuilder onConnectionSaved={vi.fn()} />);

    expect(await screen.findByText("No SQLite databases were found under the configured datasets folder.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeDisabled();
  });

  it("validates required fields before test or save", async () => {
    const user = userEvent.setup();
    render(<ConnectionBuilder onConnectionSaved={vi.fn()} />);
    await screen.findByRole("option", { name: "risk/loan_book" });

    await user.click(screen.getByRole("button", { name: "Test" }));
    expect(screen.getByText("Enter a connection label before testing or saving.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save Connection" }));
    expect(mockedCreateConnection).not.toHaveBeenCalled();
  });

  it("shows test feedback and saves a new connection", async () => {
    const user = userEvent.setup();
    const onConnectionSaved = vi.fn();
    render(<ConnectionBuilder onConnectionSaved={onConnectionSaved} />);

    await user.type(screen.getByLabelText("Connection label"), "Loan Book");
    await user.selectOptions(screen.getByLabelText("Database"), "risk/loan_book.sqlite");
    await user.click(screen.getByRole("button", { name: "Test" }));

    expect(await screen.findByText("Connection test succeeded.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save Connection" }));

    await waitFor(() => expect(onConnectionSaved).toHaveBeenCalledWith(expect.objectContaining({ label: "Loan Book" })));
    expect(mockedCreateConnection).toHaveBeenCalledWith({
      label: "Loan Book",
      driver: "sqlite",
      database_path: "risk/loan_book.sqlite"
    });
    expect(screen.getByText("Connection saved.")).toBeInTheDocument();
  });

  it("opens a saved connection with read-only label and updates the selected database", async () => {
    const user = userEvent.setup();
    const onConnectionSaved = vi.fn();
    mockedListDatabaseOptions.mockResolvedValue({
      databases: [
        { value: "risk/loan_book.sqlite", label: "risk/loan_book" },
        { value: "portfolio.db", label: "portfolio" }
      ]
    });
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={onConnectionSaved} />);

    expect(await screen.findByRole("heading", { name: "Loan Book" })).toBeInTheDocument();
    expect(screen.getByLabelText("Connection label")).toHaveValue("Loan Book");
    expect(screen.getByLabelText("Connection label")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Database")).toHaveValue("risk/loan_book.sqlite");

    await user.selectOptions(screen.getByLabelText("Database"), "portfolio.db");
    await user.click(screen.getByRole("button", { name: "Save Connection" }));

    await waitFor(() => expect(mockedUpdateConnection).toHaveBeenCalledWith("conn_1", { driver: "sqlite", database_path: "portfolio.db" }));
    expect(onConnectionSaved).toHaveBeenCalledWith(expect.objectContaining({ database_path: "portfolio.db" }));
    expect(screen.getByText("Connection saved.")).toBeInTheDocument();
  });

  it("tests a saved connection and refreshes the selected state", async () => {
    const user = userEvent.setup();
    const onConnectionSaved = vi.fn();
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={onConnectionSaved} />);

    await screen.findByRole("heading", { name: "Loan Book" });
    await user.click(screen.getByRole("button", { name: "Test" }));

    expect(await screen.findByText("Connection test succeeded.")).toBeInTheDocument();
    expect(mockedTestSavedConnection).toHaveBeenCalledWith("conn_1");
    expect(onConnectionSaved).toHaveBeenCalledWith(expect.objectContaining({ last_tested_at: "2026-07-16T10:05:00Z" }));
  });

  it("shows Drop only for saved connections and cancels confirmation without deleting", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onConnectionDropped = vi.fn();
    render(<ConnectionBuilder connectionId="conn_1" onConnectionDropped={onConnectionDropped} onConnectionSaved={vi.fn()} />);

    await screen.findByRole("heading", { name: "Loan Book" });
    await user.click(screen.getByRole("button", { name: "Drop" }));

    expect(confirmSpy).toHaveBeenCalledWith("Drop this connection? The source database file will not be deleted.");
    expect(mockedDeleteConnection).not.toHaveBeenCalled();
    expect(onConnectionDropped).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("confirms Drop, reports errors, and notifies after success", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onConnectionDropped = vi.fn();
    mockedDeleteConnection.mockRejectedValueOnce(new Error("Drop failed."));
    render(<ConnectionBuilder connectionId="conn_1" onConnectionDropped={onConnectionDropped} onConnectionSaved={vi.fn()} />);

    await screen.findByRole("heading", { name: "Loan Book" });
    await user.click(screen.getByRole("button", { name: "Drop" }));

    expect(await screen.findByText("Drop failed.")).toBeInTheDocument();
    expect(onConnectionDropped).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Drop" }));

    await waitFor(() => expect(mockedDeleteConnection).toHaveBeenCalledWith("conn_1"));
    expect(onConnectionDropped).toHaveBeenCalledWith("conn_1");
    expect(screen.getByText("Connection dropped.")).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it("does not show Drop for a new connection", async () => {
    render(<ConnectionBuilder onConnectionSaved={vi.fn()} />);

    await screen.findByRole("heading", { name: "New database connection" });

    expect(screen.queryByRole("button", { name: "Drop" })).not.toBeInTheDocument();
  });
});

describe("CreditModelerWorkbench connections", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockedListDatabaseOptions.mockResolvedValue({ databases: [{ value: "portfolio.db", label: "portfolio" }] });
    mockedListConnections.mockResolvedValue({ connections: [] });
    mockedListDataModels.mockResolvedValue({ items: [] });
    mockedCreateConnection.mockResolvedValue({
      id: "conn_1",
      label: "Portfolio",
      driver: "sqlite",
      database_path: "portfolio.db",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_tested_at: null
    });
    mockedReadConnection.mockResolvedValue({
      id: "conn_1",
      label: "Portfolio",
      driver: "sqlite",
      database_path: "portfolio.db",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_tested_at: null
    });
    mockedDeleteConnection.mockResolvedValue();
  });

  it("opens the blank builder from top-level Connections and refreshes the submenu after save", async () => {
    const user = userEvent.setup();
    render(<CreditModelerWorkbench />);

    await user.click(screen.getByRole("button", { name: "Connections" }));
    expect(await screen.findByRole("heading", { name: "New database connection" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Connection label"), "Portfolio");
    await user.selectOptions(screen.getByLabelText("Database"), "portfolio.db");
    await user.click(screen.getByRole("button", { name: "Save Connection" }));

    expect(await screen.findByText("Connection saved.")).toBeInTheDocument();
    const tree = screen.getByTestId("workbench-tree");
    expect(within(tree).getByRole("button", { name: "Portfolio" })).toBeInTheDocument();
  });

  it("resets the new connection builder when Connections is clicked again after save", async () => {
    const user = userEvent.setup();
    render(<CreditModelerWorkbench />);

    await user.click(screen.getByRole("button", { name: "Connections" }));
    await user.type(await screen.findByLabelText("Connection label"), "Portfolio");
    await user.selectOptions(screen.getByLabelText("Database"), "portfolio.db");
    await user.click(screen.getByRole("button", { name: "Save Connection" }));
    expect(await screen.findByText("Connection saved.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Connections" }));

    expect(screen.getByRole("heading", { name: "New database connection" })).toBeInTheDocument();
    expect(screen.getByLabelText("Connection label")).toHaveValue("");
    expect(screen.queryByText("Connection saved.")).not.toBeInTheDocument();
  });

  it("opens a populated builder from a saved connection tree item", async () => {
    const user = userEvent.setup();
    mockedListConnections.mockResolvedValue({
      connections: [
        {
          id: "conn_1",
          label: "Portfolio",
          driver: "sqlite",
          database_path: "portfolio.db",
          created_at: "2026-07-16T10:00:00Z",
          updated_at: "2026-07-16T10:00:00Z",
          last_tested_at: null
        }
      ]
    });
    render(<CreditModelerWorkbench />);

    const tree = screen.getByTestId("workbench-tree");
    await user.click(await within(tree).findByRole("button", { name: "Portfolio" }));

    expect(await screen.findByRole("heading", { name: "Portfolio" })).toBeInTheDocument();
    expect(mockedReadConnection).toHaveBeenCalledWith("conn_1");
    expect(screen.getByLabelText("Connection label")).toHaveAttribute("readonly");
  });

  it("removes a dropped connection from the submenu and clears the selected builder", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockedListConnections.mockResolvedValue({
      connections: [
        {
          id: "conn_1",
          label: "Portfolio",
          driver: "sqlite",
          database_path: "portfolio.db",
          created_at: "2026-07-16T10:00:00Z",
          updated_at: "2026-07-16T10:00:00Z",
          last_tested_at: null
        }
      ]
    });
    render(<CreditModelerWorkbench />);

    const tree = screen.getByTestId("workbench-tree");
    await user.click(await within(tree).findByRole("button", { name: "Portfolio" }));
    await screen.findByRole("heading", { name: "Portfolio" });
    await user.click(screen.getByRole("button", { name: "Drop" }));

    await waitFor(() => expect(mockedDeleteConnection).toHaveBeenCalledWith("conn_1"));
    expect(within(tree).queryByRole("button", { name: "Portfolio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Portfolio" })).not.toBeInTheDocument();
  });

  it("keeps saved Connections selectable when Data Models have dynamic children", async () => {
    const user = userEvent.setup();
    mockedListConnections.mockResolvedValue({
      connections: [
        {
          id: "conn_1",
          label: "Portfolio",
          driver: "sqlite",
          database_path: "portfolio.db",
          created_at: "2026-07-16T10:00:00Z",
          updated_at: "2026-07-16T10:00:00Z",
          last_tested_at: null
        }
      ]
    });
    mockedListDataModels.mockResolvedValue({
      items: [
        {
          id: "model_1",
          name: "Portfolio Star",
          description: "",
          test_status: "draft",
          diagnostics_stale: false,
          last_tested_at: null,
          last_test_succeeded_at: null,
          last_test_failed_at: null,
          created_at: "2026-07-18T10:00:00Z",
          updated_at: "2026-07-18T10:00:00Z"
        }
      ]
    });
    render(<CreditModelerWorkbench />);

    const tree = screen.getByTestId("workbench-tree");
    expect(await within(tree).findByRole("button", { name: "Portfolio Star" })).toBeInTheDocument();
    await user.click(await within(tree).findByRole("button", { name: "Portfolio" }));

    expect(await screen.findByRole("heading", { name: "Portfolio" })).toBeInTheDocument();
    expect(mockedReadConnection).toHaveBeenCalledWith("conn_1");
    expect(screen.getByLabelText("Connection label")).toHaveAttribute("readonly");
  });
});
