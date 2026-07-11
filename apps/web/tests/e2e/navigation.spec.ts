import { test, expect } from "@playwright/test";

import { waitForStablePage } from "../helpers/wait-for-stable-page";

test.describe("navigation parity", () => {
  test("navigates from landing Sign In action to /login", async ({ page }) => {
    await page.goto("/");
    await waitForStablePage(page);
    await expect(page.getByRole("link", { name: "Sign In" })).toHaveAttribute("href", "/login");

    await page.goto("/login");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
  });

  test("navigates from Reporting to /services and from CreditModeler to /creditmodeler-service", async ({ page }) => {
    await page.goto("/applications");
    await waitForStablePage(page);
    await expect(page.getByRole("link", { name: "Open services" })).toHaveAttribute("href", "/services");

    await page.goto("/services");

    await expect(page).toHaveURL(/\/services$/);
    await waitForStablePage(page);

    await expect(page.getByRole("link", { name: "Open CreditModeler service" })).toHaveAttribute("href", "/creditmodeler-service");

    await page.goto("/creditmodeler-service");
    await expect(page).toHaveURL(/\/creditmodeler-service$/);
  });

  test("preserves browser history across supported routes", async ({ page }) => {
    await page.goto("/services");
    await expect(page).toHaveURL(/\/services$/);

    await page.goto("/creditmodeler-service");
    await expect(page).toHaveURL(/\/creditmodeler-service$/);

    await page.goBack();

    await expect(page).toHaveURL(/\/services$/);

    await page.goForward();
    await expect(page).toHaveURL(/\/creditmodeler-service$/);
  });
});
