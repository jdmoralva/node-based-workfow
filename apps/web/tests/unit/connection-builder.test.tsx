import { act, render, screen, waitFor, within } from "@testing-library/react";
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

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
    expect(await screen.findByRole("option", { name: "risk/loan_book" })).toHaveValue("risk/loan_book.sqlite");
    expect(screen.getByText("SQLite connection")).toBeInTheDocument();
    expect(screen.getByText("Connection details")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Connection readiness" })).toHaveTextContent("1 of 3");
    expect(screen.getByLabelText("Connection health")).toHaveTextContent("Not tested");
    expect(screen.getByText("Untested")).toBeInTheDocument();
    expect(screen.getByLabelText("Connection label")).toHaveValue("");
    expect(screen.getByLabelText("Database type")).toHaveValue("SQLite");
    expect(screen.getByRole("button", { name: "Test connection" })).toBeInTheDocument();
  });

  it("shows an empty discovery state", async () => {
    mockedListDatabaseOptions.mockResolvedValue({ databases: [] });

    render(<ConnectionBuilder onConnectionSaved={vi.fn()} />);

    expect(await screen.findByText("No SQLite databases were found under the configured datasets folder.")).toBeInTheDocument();
    expect(screen.getAllByText("No databases").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Test connection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeDisabled();
  });

  it("validates required fields before test or save", async () => {
    const user = userEvent.setup();
    render(<ConnectionBuilder onConnectionSaved={vi.fn()} />);
    await screen.findByRole("option", { name: "risk/loan_book" });

    await user.click(screen.getByRole("button", { name: "Test connection" }));
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
    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(await screen.findByText("Connection test succeeded.")).toBeInTheDocument();
    expect(screen.getByText("Tested")).toBeInTheDocument();
    expect(screen.getByLabelText("Connection health")).toHaveTextContent("Passed this session");
    expect(screen.getByRole("region", { name: "Connection readiness" })).toHaveTextContent("3 of 3");

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
    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(await screen.findByText("Connection test succeeded.")).toBeInTheDocument();
    expect(mockedTestSavedConnection).toHaveBeenCalledWith("conn_1");
    expect(onConnectionSaved).toHaveBeenCalledWith(expect.objectContaining({ last_tested_at: "2026-07-16T10:05:00Z" }));
  });

  it("renders the loaded saved test date in UTC", async () => {
    mockedReadConnection.mockResolvedValue({
      id: "conn_1",
      label: "Loan Book",
      driver: "sqlite",
      database_path: "risk/loan_book.sqlite",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_tested_at: "2026-07-16T23:30:00-05:00"
    });
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={vi.fn()} />);

    await screen.findByRole("heading", { name: "Loan Book" });

    expect(screen.getByText("Tested")).toBeInTheDocument();
    expect(screen.getByLabelText("Connection health")).toHaveTextContent("17 Jul 2026");
  });

  it("shows exact busy labels and disables conflicting actions", async () => {
    const user = userEvent.setup();
    const testResult = deferred<Awaited<ReturnType<typeof testUnsavedConnection>>>();
    mockedTestUnsavedConnection.mockReturnValue(testResult.promise);
    render(<ConnectionBuilder onConnectionSaved={vi.fn()} />);
    await screen.findByRole("option", { name: "risk/loan_book" });
    await user.type(screen.getByLabelText("Connection label"), "Loan Book");

    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(screen.getByRole("button", { name: "Testing..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeDisabled();
    expect(screen.getByText("Testing")).toBeInTheDocument();

    await act(async () => testResult.resolve({ ok: true, message: "Connection test succeeded." }));
    expect(await screen.findByText("Connection test succeeded.")).toBeInTheDocument();
  });

  it.each(["connection-first", "options-first"] as const)("retains the saved database when hydration resolves %s", async (resolutionOrder) => {
    const databaseOptions = deferred<Awaited<ReturnType<typeof listDatabaseOptions>>>();
    const savedConnection = deferred<Awaited<ReturnType<typeof readConnection>>>();
    mockedListDatabaseOptions.mockReturnValue(databaseOptions.promise);
    mockedReadConnection.mockReturnValue(savedConnection.promise);
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={vi.fn()} />);

    const optionsResponse = {
      databases: [
        { value: "portfolio.db", label: "portfolio" },
        { value: "risk/loan_book.sqlite", label: "risk/loan_book" }
      ]
    };
    const connectionResponse = {
      id: "conn_1",
      label: "Loan Book",
      driver: "sqlite" as const,
      database_path: "risk/loan_book.sqlite",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_tested_at: null
    };

    if (resolutionOrder === "connection-first") {
      await act(async () => savedConnection.resolve(connectionResponse));
      await screen.findByRole("heading", { name: "Loan Book" });
      await act(async () => databaseOptions.resolve(optionsResponse));
    } else {
      await act(async () => databaseOptions.resolve(optionsResponse));
      await screen.findByRole("option", { name: "portfolio" });
      await act(async () => savedConnection.resolve(connectionResponse));
    }

    await waitFor(() => expect(screen.getByLabelText("Database")).toHaveValue("risk/loan_book.sqlite"));
  });

  it("tests a changed saved database as the visible unsaved selection", async () => {
    const user = userEvent.setup();
    mockedListDatabaseOptions.mockResolvedValue({
      databases: [
        { value: "risk/loan_book.sqlite", label: "risk/loan_book" },
        { value: "portfolio.db", label: "portfolio" }
      ]
    });
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={vi.fn()} />);

    await screen.findByRole("heading", { name: "Loan Book" });
    await user.selectOptions(screen.getByLabelText("Database"), "portfolio.db");
    expect(screen.getByText("Database selection changed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Test connection" }));

    await waitFor(() => expect(mockedTestUnsavedConnection).toHaveBeenCalledWith({ driver: "sqlite", database_path: "portfolio.db" }));
    expect(mockedTestSavedConnection).not.toHaveBeenCalled();
    expect(screen.getByText("Tested")).toBeInTheDocument();
    expect(screen.getByLabelText("Connection health")).toHaveTextContent("Passed this session");
  });

  it("rebases a saved database update before the next saved test", async () => {
    const user = userEvent.setup();
    mockedListDatabaseOptions.mockResolvedValue({
      databases: [
        { value: "risk/loan_book.sqlite", label: "risk/loan_book" },
        { value: "portfolio.db", label: "portfolio" }
      ]
    });
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={vi.fn()} />);

    await screen.findByRole("heading", { name: "Loan Book" });
    await user.selectOptions(screen.getByLabelText("Database"), "portfolio.db");
    await user.click(screen.getByRole("button", { name: "Save Connection" }));
    await screen.findByText("Connection saved.");
    await user.click(screen.getByRole("button", { name: "Test connection" }));

    await waitFor(() => expect(mockedTestSavedConnection).toHaveBeenCalledWith("conn_1"));
    expect(mockedTestUnsavedConnection).not.toHaveBeenCalled();
  });

  it("separates discovery failure from an empty catalog and keeps saved Drop available", async () => {
    mockedListDatabaseOptions.mockRejectedValue(new Error("Unavailable"));
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={vi.fn()} />);

    expect(await screen.findByText("Database options could not be loaded.")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
    expect(screen.queryByText("No SQLite databases were found under the configured datasets folder.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test connection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Drop" })).toBeEnabled();
  });

  it("disables every saved action when the connection cannot be loaded", async () => {
    mockedReadConnection.mockRejectedValue(new Error("Unavailable"));
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={vi.fn()} />);

    expect(await screen.findByText("Connection could not be loaded.")).toBeInTheDocument();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Test connection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Drop" })).toBeDisabled();
  });

  it("keeps a missing saved database visible until an available replacement is selected", async () => {
    const user = userEvent.setup();
    mockedListDatabaseOptions.mockResolvedValue({ databases: [{ value: "portfolio.db", label: "portfolio" }] });
    render(<ConnectionBuilder connectionId="conn_1" onConnectionSaved={vi.fn()} />);

    expect(await screen.findByRole("option", { name: "risk/loan_book · unavailable" })).toHaveValue("risk/loan_book.sqlite");
    expect(screen.getByText("Database unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test connection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Drop" })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText("Database"), "portfolio.db");

    expect(screen.getByText("Untested")).toBeInTheDocument();
    expect(screen.getByText("Database selection changed")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Connection readiness" })).toHaveTextContent("2 of 3");
    expect(screen.getByRole("button", { name: "Test connection" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save Connection" })).toBeEnabled();
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
