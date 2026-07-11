import { test, expect } from "@playwright/test";

test.describe("card behavior", () => {
  test("keeps AI Copilot and Documentation non-navigable", async ({ page }) => {
    await page.goto("/applications");

    await expect(page.getByRole("link", { name: "Open services" })).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: "AI Copilot" })).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: "Documentation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "AI Copilot" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Documentation" })).toHaveCount(0);
  });

  test("keeps Mortgage and PayrollDeduction non-navigable", async ({ page }) => {
    await page.goto("/services");

    await expect(page.getByRole("article").filter({ hasText: "Mortgage" })).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: "PayrollDeduction" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mortgage" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "PayrollDeduction" })).toHaveCount(0);
  });

  test("does not navigate when card-internal controls are activated", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: "Reporting app options" }).click();

    await expect(page).toHaveURL(/\/applications$/);

    await page.goto("/services");
    await page.getByRole("button", { name: "More CreditModeler options" }).click();

    await expect(page).toHaveURL(/\/services$/);
  });
});
