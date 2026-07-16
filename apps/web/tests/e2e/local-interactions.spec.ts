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
});
