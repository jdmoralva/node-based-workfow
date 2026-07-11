import { test, expect } from "@playwright/test";

import { requiredViewports } from "../helpers/viewports";

const routeChecks = [
  { path: "/", heading: "APPLICATIONS" },
  { path: "/login", heading: "SIGN IN" },
  { path: "/applications", heading: "APPLICATIONS" },
  { path: "/services", heading: "SERVICES" },
  { path: "/creditmodeler-service", heading: "CREDITMODELER" }
] as const;

const viewportCases = Object.entries(requiredViewports) as Array<
  [keyof typeof requiredViewports, (typeof requiredViewports)[keyof typeof requiredViewports]]
>;

test.describe("responsive layout coverage", () => {
  for (const [viewportLabel, viewport] of viewportCases) {
    for (const routeCheck of routeChecks) {
      test(`${routeCheck.path} remains usable at ${viewportLabel}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(routeCheck.path);

        await expect(page.getByRole("heading", { name: routeCheck.heading })).toBeVisible();

        const horizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(horizontalScroll).toBe(false);
      });
    }
  }
});
