import { expect, test } from "@playwright/test";

import { desktopBaselineViewports } from "../fixtures/viewports";
import { getLegacyBaselineFileName, getLegacyReferenceUrl, legacyRouteFixtures } from "../fixtures/legacy-routes";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

test.describe("legacy desktop baseline capture", () => {
  for (const route of legacyRouteFixtures) {
    for (const [viewportLabel, viewport] of Object.entries(desktopBaselineViewports)) {
      test(`captures ${route.key} at ${viewportLabel}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(getLegacyReferenceUrl(route.legacy));

        await expect(page.locator("body")).toContainText(route.readyText);
        await waitForStablePage(page);
        await expect(page).toHaveScreenshot(getLegacyBaselineFileName(route.key, viewportLabel), { fullPage: true });
      });
    }
  }
});
