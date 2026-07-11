import { test, expect } from "@playwright/test";

const publicSnapshots = [
  { path: "/", heading: "APPLICATIONS", name: "home" },
  { path: "/login", heading: "SIGN IN", name: "login" }
] as const;

const viewports = [
  { label: "desktop-standard", width: 1366, height: 768 },
  { label: "desktop-wide", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 }
] as const;

test.describe("@visual public pages", () => {
  for (const snapshot of publicSnapshots) {
    for (const viewport of viewports) {
      test(`${snapshot.name} visual baseline at ${viewport.label}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(snapshot.path);

        await expect(page.getByRole("heading", { name: snapshot.heading })).toBeVisible();
        await expect(page).toHaveScreenshot(`${snapshot.name}-${viewport.label}.png`, { fullPage: true });
      });
    }
  }
});
