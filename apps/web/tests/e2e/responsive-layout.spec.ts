import { expect, test } from "@playwright/test";

import { requiredViewports } from "../helpers/viewports";
import { hasHorizontalOverflow, measureElement } from "../helpers/measure-layout";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

const routeChecks = [
  { path: "/", heading: "APPLICATIONS", primaryRegionTestId: "application-grid", requiresAppNav: true },
  { path: "/login", heading: "SIGN IN", primaryRegionTestId: "login-panel", requiresAppNav: false },
  { path: "/applications", heading: "APPLICATIONS", primaryRegionTestId: "application-grid", requiresAppNav: true },
  { path: "/services", heading: "SERVICES", primaryRegionTestId: "service-grid", requiresAppNav: true },
  {
    path: "/creditmodeler-service",
    heading: null,
    primaryRegionTestId: "workbench",
    requiresAppNav: true
  }
] as const;

const viewportCases = [
  ["tablet", requiredViewports.tablet],
  ["mobile", requiredViewports.mobile]
] as const;

test.describe("responsive layout coverage", () => {
  for (const [viewportLabel, viewport] of viewportCases) {
    for (const routeCheck of routeChecks) {
      test(`${routeCheck.path} remains usable at ${viewportLabel}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(routeCheck.path);
        await waitForStablePage(page);

        if (routeCheck.heading) {
          await expect(page.getByRole("heading", { name: routeCheck.heading })).toBeVisible();
        }

        await expect(page.getByTestId(routeCheck.primaryRegionTestId)).toBeVisible();

        if (routeCheck.requiresAppNav) {
          await expect(page.getByTestId("app-sidebar")).toBeVisible();
          await expect(page.getByTestId("app-sidebar").getByRole("link", { name: "Applications" })).toBeVisible();
        }

        if (routeCheck.path === "/creditmodeler-service") {
          const stageBarBox = await measureElement(page.getByTestId("stage-bar"));
          expect(stageBarBox.x).toBeGreaterThanOrEqual(0);
          expect(stageBarBox.x + stageBarBox.width).toBeLessThanOrEqual(viewport.width + 1);
        }

        const regionBox = await measureElement(page.getByTestId(routeCheck.primaryRegionTestId));
        expect(regionBox.x).toBeGreaterThanOrEqual(0);
        expect(regionBox.x + regionBox.width).toBeLessThanOrEqual(viewport.width + 1);

        const horizontalScroll = await hasHorizontalOverflow(page);
        expect(horizontalScroll).toBe(false);
      });
    }
  }
});
