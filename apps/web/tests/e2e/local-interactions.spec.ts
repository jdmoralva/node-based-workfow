import { test, expect } from "@playwright/test";

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
    let releaseLoginRequest: (() => void) | null = null;

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

    releaseLoginRequest?.();
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

    await page.getByRole("button", { name: "Connections" }).click();
    await expect(page.getByRole("heading", { name: "New database connection" })).toBeVisible({ timeout: 2000 });

    await page.getByLabel("Connection label").fill("Loan Book");
    await page.getByLabel("Database").selectOption("risk/loan_book.sqlite");
    await page.getByRole("button", { name: "Test" }).click();
    await expect(page.getByText("Connection test succeeded.")).toBeVisible({ timeout: 2000 });

    await page.getByRole("button", { name: "Save Connection" }).click();
    await expect(page.getByText("Connection saved.")).toBeVisible({ timeout: 2000 });
    await expect(page.getByRole("button", { name: "Loan Book" })).toBeVisible({ timeout: 2000 });

    await page.getByRole("button", { name: "Loan Book" }).click();
    await expect(page.getByRole("heading", { name: "Loan Book" })).toBeVisible({ timeout: 2000 });
    await expect(page.getByLabel("Connection label")).toHaveAttribute("readonly", "");

    await page.getByLabel("Database").selectOption("portfolio.db");
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
});
