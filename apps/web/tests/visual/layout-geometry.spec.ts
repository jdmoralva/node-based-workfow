import { expect, test } from "@playwright/test";

import { desktopBaselineViewports } from "../fixtures/viewports";
import { hasHorizontalOverflow, measureElement } from "../helpers/measure-layout";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

type RouteGeometryCase = {
  path: "/" | "/login" | "/applications" | "/services" | "/creditmodeler-service";
  heroTestId: "page-hero" | "stage-bar";
  primaryRegionTestId: string;
  heroMinWidth: number;
  heroMaxWidth: number;
  primaryMinWidth: number;
  primaryMaxWidth: number;
  primaryMinX?: number;
  expectsSidebar: boolean;
};

const routeGeometryCases: readonly RouteGeometryCase[] = [
  {
    path: "/",
    heroTestId: "page-hero",
    primaryRegionTestId: "application-card-Reporting",
    heroMinWidth: 430,
    heroMaxWidth: 540,
    primaryMinWidth: 300,
    primaryMaxWidth: 390,
    expectsSidebar: true
  },
  {
    path: "/login",
    heroTestId: "page-hero",
    primaryRegionTestId: "login-panel",
    heroMinWidth: 300,
    heroMaxWidth: 420,
    primaryMinWidth: 520,
    primaryMaxWidth: 760,
    expectsSidebar: false
  },
  {
    path: "/applications",
    heroTestId: "page-hero",
    primaryRegionTestId: "application-card-Reporting",
    heroMinWidth: 430,
    heroMaxWidth: 540,
    primaryMinWidth: 300,
    primaryMaxWidth: 390,
    expectsSidebar: true
  },
  {
    path: "/services",
    heroTestId: "page-hero",
    primaryRegionTestId: "service-card-CreditModeler",
    heroMinWidth: 800,
    heroMaxWidth: 980,
    primaryMinWidth: 260,
    primaryMaxWidth: 380,
    expectsSidebar: true
  },
  {
    path: "/creditmodeler-service",
    heroTestId: "stage-bar",
    primaryRegionTestId: "workbench-tree",
    heroMinWidth: 200,
    heroMaxWidth: 520,
    primaryMinWidth: 200,
    primaryMaxWidth: 280,
    primaryMinX: 72,
    expectsSidebar: true
  }
] as const;

test.describe("@visual desktop layout geometry", () => {
  for (const routeCase of routeGeometryCases) {
    for (const [viewportLabel, viewport] of Object.entries(desktopBaselineViewports)) {
      test(`${routeCase.path} preserves desktop geometry at ${viewportLabel}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(routeCase.path);
        await waitForStablePage(page);

        const topbar = page.getByTestId("app-topbar");
        const content = page.getByTestId("app-content");
        const hero = page.getByTestId(routeCase.heroTestId);
        const primaryRegion = page.getByTestId(routeCase.primaryRegionTestId);

        const topbarBox = await measureElement(topbar);
        const contentBox = await measureElement(content);
        const heroBox = await measureElement(hero);
        const primaryBox = await measureElement(primaryRegion);

        expect(topbarBox.height).toBeGreaterThanOrEqual(100);
        expect(topbarBox.height).toBeLessThanOrEqual(150);
        expect(contentBox.y).toBeGreaterThan(topbarBox.height - 10);
        expect(heroBox.width).toBeGreaterThanOrEqual(routeCase.heroMinWidth);
        expect(heroBox.width).toBeLessThanOrEqual(routeCase.heroMaxWidth);
        expect(primaryBox.width).toBeGreaterThanOrEqual(routeCase.primaryMinWidth);
        expect(primaryBox.width).toBeLessThanOrEqual(routeCase.primaryMaxWidth);

        if (routeCase.expectsSidebar) {
          const sidebarBox = await measureElement(page.getByTestId("app-sidebar"));
          expect(sidebarBox.width).toBeGreaterThanOrEqual(36);
          expect(sidebarBox.width).toBeLessThanOrEqual(60);
          expect(sidebarBox.x + sidebarBox.width).toBeLessThan(primaryBox.x);
          expect(primaryBox.x).toBeGreaterThanOrEqual(routeCase.primaryMinX ?? 100);
        } else {
          await expect(page.getByTestId("app-sidebar")).toHaveCount(0);
        }

        expect(await hasHorizontalOverflow(page)).toBe(false);
      });
    }
  }
});
