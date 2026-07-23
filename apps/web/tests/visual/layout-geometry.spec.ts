import { expect, test } from "@playwright/test";

import { creditModelerDesktopViewports, desktopBaselineViewports } from "../fixtures/viewports";
import { createAuthenticatedStorageState } from "../helpers/auth-session";
import { hasHorizontalOverflow, isWithinTolerance, measureElement } from "../helpers/measure-layout";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

const legacyDesktopTolerance = 4;
const protectedGeometryRoutes = new Set<string>(["/", "/applications", "/services", "/creditmodeler-service"]);

const creditModelerGeometryTargets = {
  desktopStandard: {
    topbarHeight: 135,
    sidebarY: 152,
    treeY: 153,
    canvasY: 153,
    canvasWidth: 1052
  },
  desktopWide: {
    topbarHeight: 135,
    sidebarY: 152,
    treeY: 153,
    canvasY: 153,
    canvasWidth: 1126
  }
} as const;

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
      test(`${routeCase.path} preserves desktop geometry at ${viewportLabel}`, async ({ page, request }) => {
        test.skip(protectedGeometryRoutes.has(routeCase.path) && !process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

        if (protectedGeometryRoutes.has(routeCase.path)) {
          const storageState = await createAuthenticatedStorageState(request);
          await page.context().addCookies(storageState.cookies);
        }

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

        if (routeCase.path === "/creditmodeler-service") {
          const viewportTargets = creditModelerGeometryTargets[viewportLabel as keyof typeof creditModelerGeometryTargets];
          const sidebarBox = await measureElement(page.getByTestId("app-sidebar"));
          const canvasBox = await measureElement(page.getByTestId("workbench-canvas"));

          expect(isWithinTolerance(topbarBox.height, viewportTargets.topbarHeight, legacyDesktopTolerance)).toBe(true);
          expect(isWithinTolerance(sidebarBox.y, viewportTargets.sidebarY, legacyDesktopTolerance)).toBe(true);
          expect(isWithinTolerance(primaryBox.y, viewportTargets.treeY, legacyDesktopTolerance)).toBe(true);
          expect(isWithinTolerance(canvasBox.y, viewportTargets.canvasY, legacyDesktopTolerance)).toBe(true);
          expect(isWithinTolerance(canvasBox.width, viewportTargets.canvasWidth, legacyDesktopTolerance)).toBe(true);
        }

        expect(await hasHorizontalOverflow(page)).toBe(false);
      });
    }
  }

  for (const [viewportLabel, viewport] of Object.entries(creditModelerDesktopViewports)) {
    test(`/creditmodeler-service keeps the workbench frame aligned to the shell at ${viewportLabel}`, async ({ page, request }) => {
      test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

      const storageState = await createAuthenticatedStorageState(request);
      await page.context().addCookies(storageState.cookies);

      await page.setViewportSize(viewport);
      await page.goto("/creditmodeler-service");
      await waitForStablePage(page);

      const topbarBox = await measureElement(page.getByTestId("app-topbar"));
      const sidebarBox = await measureElement(page.getByTestId("app-sidebar"));
      const treeBox = await measureElement(page.getByTestId("workbench-tree"));
      const canvasBox = await measureElement(page.getByTestId("workbench-canvas"));

      expect(isWithinTolerance(treeBox.y, sidebarBox.y + 1, legacyDesktopTolerance)).toBe(true);
      expect(isWithinTolerance(canvasBox.y, sidebarBox.y + 1, legacyDesktopTolerance)).toBe(true);
      expect(treeBox.y).toBeGreaterThanOrEqual(topbarBox.height);
    });

    test(`/creditmodeler-service keeps the tree readable without horizontal overflow at ${viewportLabel}`, async ({ page, request }) => {
      test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

      const storageState = await createAuthenticatedStorageState(request);
      await page.context().addCookies(storageState.cookies);

      await page.setViewportSize(viewport);
      await page.goto("/creditmodeler-service");
      await waitForStablePage(page);

      await page.getByRole("button", { name: "Workflows submenu" }).click();

      const treeBox = await measureElement(page.getByTestId("workbench-tree"));
      const treeBody = page.getByTestId("workbench-tree-body");
      const treeBodyBox = await measureElement(treeBody);
      const metrics = await treeBody.evaluate((element) => {
        const transitionLabel = [...element.querySelectorAll(".rv-tree-item__label")].find((node) => node.textContent?.trim() === "TransitionAnalysis") as HTMLElement | undefined;

        if (!transitionLabel) {
          throw new Error("TransitionAnalysis label not found.");
        }

        const computedStyle = window.getComputedStyle(element);

        return {
          bodyHasNoHorizontalOverflow: element.scrollWidth <= element.clientWidth,
          bodyUsesVerticalScroll: computedStyle.overflowY === "auto" || computedStyle.overflowY === "scroll",
          bodyHidesHorizontalOverflow: computedStyle.overflowX === "hidden",
          transitionLabelFits: transitionLabel.scrollWidth <= transitionLabel.clientWidth
        };
      });

      expect(treeBox.width).toBeGreaterThanOrEqual(220);
      expect(treeBodyBox.y).toBeGreaterThan(treeBox.y);
      expect(treeBodyBox.height).toBeLessThan(treeBox.height);
      expect(metrics.transitionLabelFits).toBe(true);
      expect(metrics.bodyHasNoHorizontalOverflow).toBe(true);
      expect(metrics.bodyUsesVerticalScroll).toBe(true);
      expect(metrics.bodyHidesHorizontalOverflow).toBe(true);
    });
  }

  test(`/creditmodeler-service renders Connection Builder inside the existing canvas frame`, async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

    const storageState = await createAuthenticatedStorageState(request);
    await page.context().addCookies(storageState.cookies);
    await page.route("**/api/connections", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connections: [] }) });
    });
    await page.route("**/api/connections/databases", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ databases: [{ value: "portfolio.db", label: "portfolio" }] })
      });
    });

    await page.setViewportSize(creditModelerDesktopViewports.desktopStandard);
    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    const canvasBefore = await measureElement(page.getByTestId("workbench-canvas"));
    await page.getByRole("button", { name: "Connections", exact: true }).click();
    await expect(page.getByTestId("connection-builder")).toBeVisible();

    const canvasAfter = await measureElement(page.getByTestId("workbench-canvas"));
    const builderBox = await measureElement(page.getByTestId("connection-builder"));

    expect(isWithinTolerance(canvasAfter.x, canvasBefore.x, legacyDesktopTolerance)).toBe(true);
    expect(isWithinTolerance(canvasAfter.y, canvasBefore.y, legacyDesktopTolerance)).toBe(true);
    expect(isWithinTolerance(canvasAfter.width, canvasBefore.width, legacyDesktopTolerance)).toBe(true);
    expect(builderBox.x).toBeGreaterThanOrEqual(canvasAfter.x);
    expect(builderBox.y).toBeGreaterThanOrEqual(canvasAfter.y);
    expect(builderBox.x + builderBox.width).toBeLessThanOrEqual(canvasAfter.x + canvasAfter.width);
    expect(builderBox.y + builderBox.height).toBeLessThanOrEqual(canvasAfter.y + canvasAfter.height);
  });

  test(`/creditmodeler-service renders Data Model Builder without shifting shell geometry`, async ({ page, request }) => {
    test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

    const storageState = await createAuthenticatedStorageState(request);
    await page.context().addCookies(storageState.cookies);
    await page.route("**/api/connections", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connections: [] }) });
    });
    await page.route("**/api/data-models", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });

    await page.setViewportSize(creditModelerDesktopViewports.desktopStandard);
    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    const stageBefore = await measureElement(page.getByTestId("stage-bar"));
    const treeBefore = await measureElement(page.getByTestId("workbench-tree"));
    const canvasBefore = await measureElement(page.getByTestId("workbench-canvas"));

    await page.getByRole("button", { name: "Data Models", exact: true }).click();
    await expect(page.getByTestId("data-model-builder")).toBeVisible();

    const stageAfter = await measureElement(page.getByTestId("stage-bar"));
    const treeAfter = await measureElement(page.getByTestId("workbench-tree"));
    const canvasAfter = await measureElement(page.getByTestId("workbench-canvas"));
    const builderBox = await measureElement(page.getByTestId("data-model-builder"));

    expect(isWithinTolerance(stageAfter.x, stageBefore.x, legacyDesktopTolerance)).toBe(true);
    expect(isWithinTolerance(treeAfter.x, treeBefore.x, legacyDesktopTolerance)).toBe(true);
    expect(isWithinTolerance(treeAfter.width, treeBefore.width, legacyDesktopTolerance)).toBe(true);
    expect(isWithinTolerance(canvasAfter.x, canvasBefore.x, legacyDesktopTolerance)).toBe(true);
    expect(isWithinTolerance(canvasAfter.y, canvasBefore.y, legacyDesktopTolerance)).toBe(true);
    expect(isWithinTolerance(canvasAfter.width, canvasBefore.width, legacyDesktopTolerance)).toBe(true);
    expect(builderBox.x).toBeGreaterThanOrEqual(canvasAfter.x);
    expect(builderBox.y).toBeGreaterThanOrEqual(canvasAfter.y);
    expect(builderBox.x + builderBox.width).toBeLessThanOrEqual(canvasAfter.x + canvasAfter.width);
    expect(builderBox.y + builderBox.height).toBeLessThanOrEqual(canvasAfter.y + canvasAfter.height);
  });
});
