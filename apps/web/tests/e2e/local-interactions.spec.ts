import { test, expect } from "@playwright/test";

test.describe("frontend-only local interactions", () => {
  test("shows login validation without backend effects", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Username is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();

    const localStorageLength = await page.evaluate(() => window.localStorage.length);
    const sessionStorageLength = await page.evaluate(() => window.sessionStorage.length);

    expect(localStorageLength).toBe(0);
    expect(sessionStorageLength).toBe(0);
  });

  test("updates selected application card state locally", async ({ page }) => {
    await page.goto("/applications");

    const reportingCard = page.getByTestId("application-card-Reporting");
    const documentationCard = page.getByTestId("application-card-Documentation");

    await expect(reportingCard).toHaveAttribute("data-selected", "true");
    await documentationCard.click({ position: { x: 40, y: 40 } });
    await expect(documentationCard).toHaveAttribute("data-selected", "true");
    await expect(reportingCard).toHaveAttribute("data-selected", "false");
  });

  test("expands and selects workbench tree items locally", async ({ page }) => {
    await page.goto("/creditmodeler-service");

    const variablesToggle = page.getByRole("button", { name: "Variables submenu" });
    await expect(variablesToggle).toHaveAttribute("aria-expanded", "false");

    await variablesToggle.click();
    await expect(variablesToggle).toHaveAttribute("aria-expanded", "true");

    const adjustedIncome = page.getByRole("button", { name: "AdjustedIncome" });
    await adjustedIncome.click();
    await expect(adjustedIncome).toHaveAttribute("aria-pressed", "true");
  });
});
