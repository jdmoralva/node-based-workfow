import { test } from "@playwright/test";

import { comparePageWithLegacy } from "../helpers/compare-with-legacy";
import { legacyRouteFixtures } from "../fixtures/legacy-routes";
import { desktopBaselineViewports } from "../fixtures/viewports";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

test.describe("@visual migrated desktop comparison", () => {
  for (const route of legacyRouteFixtures) {
    for (const [viewportLabel, viewport] of Object.entries(desktopBaselineViewports)) {
      test(`${route.route} matches the approved legacy desktop baseline at ${viewportLabel}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route.route);

        await waitForStablePage(page);
        await comparePageWithLegacy(page, route.key, viewportLabel);
      });
    }
  }
});
