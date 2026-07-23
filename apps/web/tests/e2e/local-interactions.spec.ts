import { test, expect } from "@playwright/test";

import type { DataModelCreatePayload, SavedDataModel } from "@/features/creditmodeler/data-model-types";

import { requiredViewports } from "../fixtures/viewports";
import { createAuthenticatedStorageState } from "../helpers/auth-session";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

test.describe("local login and shell interactions", () => {
  test("shows login validation without backend effects", async ({ page }) => {
    await page.goto("/login");
    await waitForStablePage(page);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Username is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();

    const localStorageLength = await page.evaluate(() => window.localStorage.length);
    const sessionStorageLength = await page.evaluate(() => window.sessionStorage.length);

    expect(localStorageLength).toBe(0);
    expect(sessionStorageLength).toBe(0);
  });

  test("disables the sign-in action while the authentication request is in flight", async ({ page }) => {
    let releaseLoginRequest: () => void = () => undefined;

    await page.route("**/api/auth/login", async (route) => {
      await new Promise<void>((resolve) => {
        releaseLoginRequest = resolve;
      });

      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" })
      });
    });

    await page.goto("/login");
    await waitForStablePage(page);
    await page.getByLabel("Username").fill("analyst");
    await page.getByLabel("Password").fill("correct-horse-battery-staple");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("button", { name: "Sign In" })).toBeDisabled();

    releaseLoginRequest();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  test("shows a generic invalid-credentials message", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" })
      });
    });

    await page.goto("/login");
    await waitForStablePage(page);
    await page.getByLabel("Username").fill("analyst");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Invalid username or password.")).toBeVisible();
  });

  test("shows a distinct unavailable-service message when auth cannot be reached", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/login");
    await waitForStablePage(page);
    await page.getByLabel("Username").fill("analyst");
    await page.getByLabel("Password").fill("correct-horse-battery-staple");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("The authentication service is currently unavailable. Please try again.")).toBeVisible();
  });

  test("updates selected application card state locally", async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

    const storageState = await createAuthenticatedStorageState(request);
    await page.context().addCookies(storageState.cookies);

    await page.goto("/applications");
    await waitForStablePage(page);

    const reportingCard = page.getByTestId("application-card-Reporting");
    const documentationCard = page.getByTestId("application-card-Documentation");

    await expect(reportingCard).toHaveAttribute("data-selected", "true");
    await documentationCard.click();
    await expect(documentationCard).toHaveAttribute("data-selected", "true");
    await expect(reportingCard).toHaveAttribute("data-selected", "false");
  });

  test("expands and selects workbench tree items locally", async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

    const storageState = await createAuthenticatedStorageState(request);
    await page.context().addCookies(storageState.cookies);

    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    const variablesToggle = page.getByRole("button", { name: "Variables submenu" });
    await expect(variablesToggle).toHaveAttribute("aria-expanded", "false");

    await variablesToggle.click();
    await expect(variablesToggle).toHaveAttribute("aria-expanded", "true");

    const adjustedIncome = page.getByRole("button", { name: "AdjustedIncome" });
    await adjustedIncome.click();
    await expect(adjustedIncome).toHaveAttribute("aria-pressed", "true");
  });

  test("creates, reopens, updates, and drops a saved connection with prompt feedback", async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

    const storageState = await createAuthenticatedStorageState(request);
    await page.context().addCookies(storageState.cookies);

    let savedConnection = {
      id: "conn_1",
      label: "Loan Book",
      driver: "sqlite",
      database_path: "risk/loan_book.sqlite",
      created_at: "2026-07-16T10:00:00Z",
      updated_at: "2026-07-16T10:00:00Z",
      last_tested_at: null as string | null
    };
    let connections = [] as typeof savedConnection[];

    await page.route("**/api/connections/databases", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          databases: [
            { value: "risk/loan_book.sqlite", label: "risk/loan_book" },
            { value: "portfolio.db", label: "portfolio" }
          ]
        })
      });
    });
    await page.route("**/api/connections", async (route) => {
      const requestMethod = route.request().method();
      if (requestMethod === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connections }) });
        return;
      }
      if (requestMethod === "POST") {
        connections = [savedConnection];
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(savedConnection) });
        return;
      }
      await route.fallback();
    });
    await page.route("**/api/connections/test", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, message: "Connection test succeeded." })
      });
    });
    await page.route("**/api/connections/conn_1", async (route) => {
      const requestMethod = route.request().method();
      if (requestMethod === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(savedConnection) });
        return;
      }
      if (requestMethod === "PUT") {
        savedConnection = { ...savedConnection, database_path: "portfolio.db", updated_at: "2026-07-16T10:02:00Z" };
        connections = [savedConnection];
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(savedConnection) });
        return;
      }
      if (requestMethod === "DELETE") {
        connections = [];
        await route.fulfill({ status: 204 });
        return;
      }
      await route.fallback();
    });
    await page.route("**/api/connections/conn_1/test", async (route) => {
      savedConnection = { ...savedConnection, last_tested_at: "2026-07-16T10:05:00Z" };
      connections = [savedConnection];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, message: "Connection test succeeded.", connection: savedConnection })
      });
    });

    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    await page.getByRole("button", { name: "Connections", exact: true }).click();
    await expect(page.getByRole("heading", { name: "New database connection" })).toBeVisible({ timeout: 2000 });

    await page.getByLabel("Connection label").fill("Loan Book");
    await page.getByTestId("connection-builder").locator("select").selectOption("risk/loan_book.sqlite");
    await page.getByRole("button", { name: "Test" }).click();
    await expect(page.getByText("Connection test succeeded.")).toBeVisible({ timeout: 2000 });

    await page.getByRole("button", { name: "Save Connection" }).click();
    await expect(page.getByText("Connection saved.")).toBeVisible({ timeout: 2000 });
    await expect(page.getByRole("button", { name: "Loan Book" })).toBeVisible({ timeout: 2000 });

    await page.getByRole("button", { name: "Loan Book" }).click();
    await expect(page.getByRole("heading", { name: "Loan Book" })).toBeVisible({ timeout: 2000 });
    await expect(page.getByLabel("Connection label")).toHaveAttribute("readonly", "");

    await page.getByTestId("connection-builder").locator("select").selectOption("portfolio.db");
    await page.getByRole("button", { name: "Save Connection" }).click();
    await expect(page.getByText("Connection saved.")).toBeVisible({ timeout: 2000 });

    await page.getByRole("button", { name: "Test" }).click();
    await expect(page.getByText("Connection test succeeded.")).toBeVisible({ timeout: 2000 });

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("source database file will not be deleted");
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "Drop" }).click();
    await expect(page.getByRole("button", { name: "Loan Book" })).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Drop" }).click();
    await expect(page.getByRole("button", { name: "Loan Book" })).toHaveCount(0, { timeout: 2000 });
  });

  test("creates, reopens, tests, saves stale, and drops a saved data model", async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");
    test.slow();

    const storageState = await createAuthenticatedStorageState(request);
    await page.context().addCookies(storageState.cookies);

    let dataModel: SavedDataModel = {
      id: "model_1",
      name: "Portfolio Star",
      description: "",
      model: { schema_version: 2, sources: [], fact_table: null, dimensions: [], relationships: [], business_rules: [], measures: [], metadata: {} },
      test_status: "draft",
      diagnostics_stale: false,
      last_tested_at: null,
      last_test_succeeded_at: null,
      last_test_failed_at: null,
      last_test_errors: [],
      last_test_warnings: [],
      created_at: "2026-07-18T10:00:00Z",
      updated_at: "2026-07-18T10:00:00Z"
    };
    let models: SavedDataModel[] = [];

    await page.route("**/api/connections", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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
        })
      });
    });
    await page.route("**/api/data-models/connections/conn_1/schema", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          connection_id: "conn_1",
          connection_label: "Portfolio",
          objects: [
            {
              name: "loans",
              object_type: "table",
              columns: [
                { name: "account_id", declared_type: "TEXT", nullable: false, primary_key: true },
                { name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: false },
                { name: "segment_id", declared_type: "TEXT", nullable: true, primary_key: false },
                { name: "balance", declared_type: "NUMERIC", nullable: true, primary_key: false },
                { name: "status", declared_type: "TEXT", nullable: true, primary_key: false },
                { name: "opened_at", declared_type: "TEXT", nullable: true, primary_key: false },
                { name: "branch_id", declared_type: "TEXT", nullable: true, primary_key: false },
                { name: "product_id", declared_type: "TEXT", nullable: true, primary_key: false }
              ]
            },
            {
              name: "customers",
              object_type: "table",
              columns: [{ name: "customer_id", declared_type: "TEXT", nullable: false, primary_key: true }]
            }
          ]
        })
      });
    });
    await page.route("**/api/data-models/test", async (route) => {
      const payload = route.request().postDataJSON() as { model: SavedDataModel["model"] };
      expect(payload.model.fact_table?.table).toBe("loans");
      expect(payload.model.dimensions[0]?.table).toBe("customers");
      expect(payload.model.relationships[0]?.key_pairs).toEqual([{ parent_column: "customer_id", child_column: "customer_id" }]);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          succeeded: true,
          status: "tested",
          errors: [],
          warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: false }]
        })
      });
    });
    await page.route("**/api/data-models", async (route) => {
      const requestMethod = route.request().method();
      if (requestMethod === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: models }) });
        return;
      }
      if (requestMethod === "POST") {
        const payload = route.request().postDataJSON() as DataModelCreatePayload;
        dataModel = {
          ...dataModel,
          name: payload.name,
          description: payload.description ?? null,
          model: payload.model ?? dataModel.model,
          test_status: "untested"
        };
        models = [dataModel];
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(dataModel) });
        return;
      }
      await route.fallback();
    });
    await page.route("**/api/data-models/model_1", async (route) => {
      const requestMethod = route.request().method();
      if (requestMethod === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dataModel) });
        return;
      }
      if (requestMethod === "PUT") {
        dataModel = { ...dataModel, description: "Edited", test_status: "stale", diagnostics_stale: true, last_test_warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: true }] };
        models = [dataModel];
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dataModel) });
        return;
      }
      if (requestMethod === "DELETE") {
        models = [];
        await route.fulfill({ status: 204 });
        return;
      }
      await route.fallback();
    });
    await page.route("**/api/data-models/model_1/test", async (route) => {
      dataModel = { ...dataModel, test_status: "tested", last_tested_at: "2026-07-18T10:05:00Z", last_test_succeeded_at: "2026-07-18T10:05:00Z" };
      models = [dataModel];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ succeeded: true, status: "tested", errors: [], warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: false }] }) });
    });

    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    await page.getByRole("button", { name: "Data Models", exact: true }).click();
    await page.getByLabel("Data model name").fill("Portfolio Star");
    await page.getByLabel("New source connection").selectOption("conn_1");
    await page.getByRole("button", { name: "Add source connection" }).click();
    await page.getByLabel("Fact source connection").selectOption("conn_1");
    await page.getByLabel("Fact table or view").selectOption("loans");
    const factSection = page.getByLabel("Fact source connection").locator("xpath=ancestor::details");
    const factControls = [
      page.getByLabel("Fact source connection"),
      page.getByLabel("Fact table or view"),
      page.getByLabel("Fact alias"),
      page.getByRole("button", { name: "Fact primary key columns" }),
      page.getByLabel("Grain")
    ];
    const expectFactControlHeight = async (height: number) => {
      for (const control of factControls) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBe(height);
      }
    };
    await expectFactControlHeight(34);
    const factSectionBox = await factSection.boundingBox();
    expect(factSectionBox).not.toBeNull();
    expect(factSectionBox!.height).toBeLessThanOrEqual(255);

    const factKeyTrigger = page.getByRole("button", { name: "Fact primary key columns" });
    await factKeyTrigger.click();
    const factKeyOptions = page.getByRole("group", { name: "Fact primary key columns options" });
    await expect(factKeyOptions).toBeVisible();
    expect(await factKeyOptions.evaluate((options) => {
      const bounds = options.getBoundingClientRect();
      const sectionBounds = options.closest("details")?.getBoundingClientRect();
      if (!sectionBounds) {
        return false;
      }
      const sampleY = bounds.top < sectionBounds.top
        ? (bounds.top + Math.min(bounds.bottom, sectionBounds.top)) / 2
        : bounds.bottom > sectionBounds.bottom
          ? (Math.max(bounds.top, sectionBounds.bottom) + bounds.bottom) / 2
          : null;
      if (sampleY === null) {
        return false;
      }
      const topElement = document.elementFromPoint(bounds.left + bounds.width / 2, sampleY);
      return topElement !== null && options.contains(topElement);
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.keyboard.press("Escape");

    const desktopViewport = page.viewportSize();
    await page.setViewportSize(requiredViewports.mobile);
    await expectFactControlHeight(40);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    if (desktopViewport) {
      await page.setViewportSize(desktopViewport);
    }

    await page.getByRole("button", { name: "Add dimension" }).click();
    const dimensionTableSelect = page.getByLabel("Dimension 1 table or view");
    const removeDimensionButton = page.getByRole("button", { name: "Remove dimension 1" });
    await removeDimensionButton.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Dimension 1 source connection")).toBeFocused();
    const expectRemoveClearOfDimensionSelectors = async () => {
      const [removeDimensionBox, dimensionSourceBox, dimensionTableBox] = await Promise.all([
        removeDimensionButton.boundingBox(),
        page.getByLabel("Dimension 1 source connection").boundingBox(),
        dimensionTableSelect.boundingBox()
      ]);
      expect(removeDimensionBox).not.toBeNull();
      expect(dimensionSourceBox).not.toBeNull();
      expect(dimensionTableBox).not.toBeNull();
      for (const selectorBox of [dimensionSourceBox!, dimensionTableBox!]) {
        const hasClearance = removeDimensionBox!.x >= selectorBox.x + selectorBox.width + 4
          || selectorBox.x >= removeDimensionBox!.x + removeDimensionBox!.width + 4
          || removeDimensionBox!.y >= selectorBox.y + selectorBox.height + 4
          || selectorBox.y >= removeDimensionBox!.y + removeDimensionBox!.height + 4;
        expect(hasClearance).toBe(true);
      }
    };
    await expectRemoveClearOfDimensionSelectors();
    await page.setViewportSize(requiredViewports.mobile);
    await expectRemoveClearOfDimensionSelectors();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    if (desktopViewport) {
      await page.setViewportSize(desktopViewport);
    }
    await dimensionTableSelect.selectOption("customers");
    await page.getByRole("button", { name: "Add relationship", exact: true }).click();
    const expectRemoveActionsAligned = async () => {
      const dimensionSource = page.getByLabel("Dimension 1 source connection");
      const relationshipParent = page.getByLabel("Relationship 1 parent table");
      const [dimensionButtonBox, dimensionLabelBox, relationshipButtonBox, relationshipLabelBox] = await Promise.all([
        page.getByRole("button", { name: "Remove dimension 1" }).boundingBox(),
        dimensionSource.locator("xpath=preceding-sibling::span").boundingBox(),
        page.getByRole("button", { name: "Remove relationship 1" }).boundingBox(),
        relationshipParent.locator("xpath=preceding-sibling::span").boundingBox()
      ]);
      expect(dimensionButtonBox).not.toBeNull();
      expect(dimensionLabelBox).not.toBeNull();
      expect(relationshipButtonBox).not.toBeNull();
      expect(relationshipLabelBox).not.toBeNull();
      const dimensionOffset = dimensionButtonBox!.y + dimensionButtonBox!.height / 2
        - (dimensionLabelBox!.y + dimensionLabelBox!.height / 2);
      const relationshipOffset = relationshipButtonBox!.y + relationshipButtonBox!.height / 2
        - (relationshipLabelBox!.y + relationshipLabelBox!.height / 2);
      expect(Math.abs(dimensionOffset - relationshipOffset)).toBeLessThanOrEqual(3);
    };
    await expectRemoveActionsAligned();
    await page.setViewportSize(requiredViewports.mobile);
    await expectRemoveActionsAligned();
    await expectRemoveClearOfDimensionSelectors();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    if (desktopViewport) {
      await page.setViewportSize(desktopViewport);
    }
    await page.getByRole("button", { name: "Add key pair for dim_customers" }).click();
    await page.getByLabel("Relationship 1 parent column 1").selectOption("customer_id");
    await page.getByLabel("Relationship 1 child column 1").selectOption("customer_id");

    await page.getByRole("button", { name: "Test model" }).click();
    await expect(page.getByText("Draft test passed. Save and retest to persist the tested status.")).toBeVisible({ timeout: 2000 });

    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page.getByRole("button", { name: "Portfolio Star" })).toBeVisible({ timeout: 2000 });
    await expect(page.getByLabel("Data model name")).toHaveAttribute("readonly", "");
    await expect(page.getByText("Data model saved.")).toBeVisible();

    await page.getByRole("button", { name: "Test model" }).click();
    await expect(page.getByText("Data model test succeeded.")).toBeVisible({ timeout: 2000 });

    await page.getByLabel("Description").fill("Edited");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Diagnostics are stale after the latest save.")).toBeVisible({ timeout: 2000 });

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Drop" }).click();
    await expect(page.getByRole("button", { name: "Portfolio Star" })).toHaveCount(0, { timeout: 2000 });
  });

  test("repairs a saved data model after a referenced connection is deleted", async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

    const storageState = await createAuthenticatedStorageState(request);
    await page.context().addCookies(storageState.cookies);

    let dataModel = {
      id: "model_repair",
      name: "Repairable Star",
      description: "",
      model: {
        schema_version: 2 as const,
        sources: [{ connection_id: "conn_missing", alias: "portfolio", metadata: {} }],
        fact_table: { id: "fact_loans", connection_id: "conn_missing", table: "loans", object_type: "table", alias: "fact_loans", grain: null, primary_key: ["account_id"], metadata: {} },
        dimensions: [{ id: "dim_customers", connection_id: "conn_missing", table: "customers", object_type: "table", alias: "dim_customers", primary_key: ["customer_id"], metadata: {} }],
        relationships: [{ id: "rel_customers", parent_table_id: "fact_loans", child_table_id: "dim_customers", join_type: "left", key_pairs: [{ parent_column: "customer_id", child_column: "customer_id" }], metadata: {} }],
        business_rules: [{ id: "rule_1", name: "rule", expression: "upper(dim_customers.name)", output_type: "text", metadata: {} }],
        measures: [],
        metadata: {}
      },
      test_status: "failed",
      diagnostics_stale: false,
      last_tested_at: null,
      last_test_succeeded_at: null,
      last_test_failed_at: null,
      last_test_errors: [{ severity: "error", code: "missing_connection", message: "A referenced Connection is missing. Select a replacement source to repair this model.", location: { section: "sources", connection_id: "conn_missing" }, stale: false }],
      last_test_warnings: [],
      created_at: "2026-07-18T10:00:00Z",
      updated_at: "2026-07-18T10:00:00Z"
    };

    await page.route("**/api/connections", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connections: [{ id: "conn_replacement", label: "Replacement", driver: "sqlite", database_path: "replacement.db", created_at: "2026-07-18T10:00:00Z", updated_at: "2026-07-18T10:00:00Z", last_tested_at: null }] })
      });
    });
    await page.route("**/api/data-models", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [dataModel] }) });
    });
    await page.route("**/api/data-models/model_repair", async (route) => {
      if (route.request().method() === "PUT") {
        const payload = route.request().postDataJSON() as { model: typeof dataModel.model };
        dataModel = { ...dataModel, model: payload.model, test_status: "untested", last_test_errors: [] };
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(dataModel) });
    });
    await page.route("**/api/data-models/model_repair/test", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ succeeded: true, status: "tested", errors: [], warnings: [{ severity: "warning", code: "compile_only", message: "Compilation only.", location: null, stale: false }] }) });
    });

    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    await page.getByRole("button", { name: "Repairable Star" }).click();
    await expect(page.getByText("A referenced Connection is missing. Select a replacement source to repair this model.")).toBeVisible({ timeout: 2000 });
    await page.getByLabel("Replacement connection").selectOption("conn_replacement");
    await page.getByRole("button", { name: "Repair Source" }).click();
    await expect(page.getByText("Source repaired. Review preserved configuration before retesting.")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("fact_loans", { exact: true })).toBeVisible();
    await expect(page.getByText("dim_customers", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Test model" }).click();
    await expect(page.getByText("Data model test succeeded.")).toBeVisible({ timeout: 2000 });
  });
});
