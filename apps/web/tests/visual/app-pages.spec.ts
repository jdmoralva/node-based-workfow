import { test, expect } from "@playwright/test";

const applicationSnapshots = [
  { path: "/applications", heading: "APPLICATIONS", name: "applications" },
  { path: "/services", heading: "SERVICES", name: "services" },
  { path: "/creditmodeler-service", heading: "CREDITMODELER", name: "creditmodeler-service" }
] as const;

const viewports = [
  { label: "desktop-standard", width: 1366, height: 768 },
  { label: "desktop-wide", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 }
] as const;

test.describe("@visual application pages", () => {
  for (const snapshot of applicationSnapshots) {
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
