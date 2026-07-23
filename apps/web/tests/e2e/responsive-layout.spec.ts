import { expect, test } from "@playwright/test";

import { requiredViewports } from "../helpers/viewports";
import { createAuthenticatedStorageState } from "../helpers/auth-session";
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
      test(`${routeCheck.path} remains usable at ${viewportLabel}`, async ({ page, request }) => {
        test.skip(routeCheck.requiresAppNav && !process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

        if (routeCheck.requiresAppNav) {
          const storageState = await createAuthenticatedStorageState(request);
          await page.context().addCookies(storageState.cookies);
        }

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

  for (const [viewportLabel, viewport] of viewportCases) {
    test(`Connection Builder stacks readiness within the workbench canvas at ${viewportLabel}`, async ({ page, request }) => {
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
      await page.route("**/api/data-models", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
      });

      await page.setViewportSize(viewport);
      await page.goto("/creditmodeler-service");
      await waitForStablePage(page);
      await page.getByRole("button", { name: "Connections", exact: true }).click();

      const canvasBox = await measureElement(page.getByTestId("workbench-canvas"));
      const builderBox = await measureElement(page.getByTestId("connection-builder"));
      const setupBox = await measureElement(page.getByRole("region", { name: "Connection setup" }));
      const readinessBox = await measureElement(page.getByRole("region", { name: "Connection readiness" }));

      expect(builderBox.x).toBeGreaterThanOrEqual(canvasBox.x);
      expect(builderBox.x + builderBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + 1);
      expect(readinessBox.y).toBeGreaterThan(setupBox.y + setupBox.height - 4);
      await expect(page.getByRole("button", { name: "Test connection" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Save Connection" })).toBeVisible();
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });

    test(`Data Model Builder remains within the workbench canvas at ${viewportLabel}`, async ({ page, request }) => {
      test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

      const storageState = await createAuthenticatedStorageState(request);
      await page.context().addCookies(storageState.cookies);
      await page.route("**/api/connections", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ connections: [] }) });
      });
      await page.route("**/api/data-models", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
      });

      await page.setViewportSize(viewport);
      await page.goto("/creditmodeler-service");
      await waitForStablePage(page);
      await page.getByRole("button", { name: "Data Models", exact: true }).click();

      const canvasBox = await measureElement(page.getByTestId("workbench-canvas"));
      const builderBox = await measureElement(page.getByTestId("data-model-builder"));

      expect(builderBox.x).toBeGreaterThanOrEqual(canvasBox.x);
      expect(builderBox.x + builderBox.width).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + 1);
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
});
