import { test, expect } from "@playwright/test";

test.describe("navigation parity", () => {
  test("navigates from landing Sign In action to /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
  });

  test("navigates from Reporting to /services and from CreditModeler to /creditmodeler-service", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("link", { name: "Open services" }).click();

    await expect(page).toHaveURL(/\/services$/);

    await page.getByRole("link", { name: "Open CreditModeler service" }).click();
    await expect(page).toHaveURL(/\/creditmodeler-service$/);
  });

  test("preserves browser history across supported routes", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("link", { name: "Open services" }).click();
    await expect(page).toHaveURL(/\/services$/);

    await page.getByRole("link", { name: "Open CreditModeler service" }).click();
    await expect(page).toHaveURL(/\/creditmodeler-service$/);

    await page.goBack();

    await expect(page).toHaveURL(/\/services$/);

    await page.goForward();
    await expect(page).toHaveURL(/\/creditmodeler-service$/);
  });
});
