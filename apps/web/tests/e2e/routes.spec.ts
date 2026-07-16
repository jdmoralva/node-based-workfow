import { test, expect } from "@playwright/test";

import { waitForStablePage } from "../helpers/wait-for-stable-page";

test.describe("direct protected-route loading", () => {
  test("redirects / to /login before protected content appears", async ({ page }) => {
    await page.goto("/");
    await waitForStablePage(page);

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "APPLICATIONS" })).not.toBeVisible();
  });

  for (const protectedPath of ["/applications", "/services", "/creditmodeler-service"] as const) {
    test(`redirects unauthenticated direct entry for ${protectedPath} to /login with next`, async ({ page }) => {
      await page.goto(protectedPath);
      await waitForStablePage(page);

      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(protectedPath).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
    });
  }

  test("does not redirect static assets or required framework resources to /login", async ({ page }) => {
    await page.goto("/login");
    await waitForStablePage(page);

    const nextAssetPath = await page.evaluate(() => {
      return (
        Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
          .map((script) => script.getAttribute("src"))
          .find((src) => src?.includes("/_next/static/")) ?? null
      );
    });

    expect(nextAssetPath).not.toBeNull();

    const assetResponse = await page.request.get(nextAssetPath!, { failOnStatusCode: false });
    const faviconResponse = await page.request.get("/favicon.ico", { failOnStatusCode: false });

    expect(assetResponse.url()).toContain("/_next/static/");
    expect(assetResponse.status()).toBeLessThan(400);
    expect(faviconResponse.url()).not.toContain("/login");
  });
});
