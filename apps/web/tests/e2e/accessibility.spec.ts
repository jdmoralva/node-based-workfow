import { test, expect } from "@playwright/test";

import { waitForStablePage } from "../helpers/wait-for-stable-page";

test.describe("accessibility coverage", () => {
  test("exposes landmarks, current-page markers, and hidden decorative icons on applications", async ({ page }) => {
    await page.goto("/applications");
    await waitForStablePage(page);

    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb navigation" })).toBeVisible();
    await expect(page.getByRole("main", { name: "Page content" })).toBeVisible();
    await expect(page.getByTestId("app-sidebar").getByRole("link", { name: "Applications" })).toHaveAttribute("aria-current", "page");

    const decorativeIconsHidden = await page.locator("svg[aria-hidden='true']").count();
    expect(decorativeIconsHidden).toBeGreaterThan(0);
  });

  test("exposes labelled fields and visible validation on login", async ({ page }) => {
    await page.goto("/login");
    await waitForStablePage(page);

    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Username is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
  });

  test("exposes tree expand state and selection semantics on the workbench", async ({ page }) => {
    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    await expect(page.getByRole("navigation", { name: "Service objects" })).toBeVisible();
    await expect(page.getByLabel("Search")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add object" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Grid view" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Branch view" })).toBeVisible();

    const analyticsToggle = page.getByRole("button", { name: "Analytics submenu" });
    await expect(analyticsToggle).toHaveAttribute("aria-expanded", "true");

    const variablesToggle = page.getByRole("button", { name: "Variables submenu" });
    await expect(variablesToggle).toHaveAttribute("aria-expanded", "false");
    await variablesToggle.click();
    await expect(variablesToggle).toHaveAttribute("aria-expanded", "true");

    const selectedItem = page.getByRole("button", { name: "AdjustedIncome" });
    await selectedItem.click();
    await expect(selectedItem).toHaveAttribute("aria-pressed", "true");
  });
});
