import { expect, test } from "@playwright/test";

import { desktopBaselineViewports } from "../fixtures/viewports";
import { isWithinTolerance, measureElement } from "../helpers/measure-layout";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

const desktopRoutes = ["/", "/login", "/applications", "/services", "/creditmodeler-service"] as const;
const legacyDesktopTolerance = 4;
const legacyStageToWorkbenchGap = 18;
const legacyWorkbenchTopbarHeight = 135;

test.describe("desktop route layout checkpoints", () => {
  for (const [viewportLabel, viewport] of Object.entries(desktopBaselineViewports)) {
    for (const route of desktopRoutes) {
      test(`${route} keeps critical desktop regions aligned at ${viewportLabel}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(route);
        await waitForStablePage(page);

        const topbarBox = await measureElement(page.getByTestId("app-topbar"));
        const anchorRegion = route === "/creditmodeler-service" ? page.getByTestId("stage-bar") : page.getByTestId("page-hero");
        const heroBox = await measureElement(anchorRegion);

        if (route === "/creditmodeler-service") {
          expect(heroBox.y).toBeGreaterThanOrEqual(topbarBox.y);
          expect(heroBox.y + heroBox.height).toBeLessThanOrEqual(topbarBox.y + topbarBox.height + 4);
        } else {
          const minimumHeroY = route === "/login" ? topbarBox.y + topbarBox.height - 12 : topbarBox.y + topbarBox.height;
          expect(heroBox.y).toBeGreaterThan(minimumHeroY);
        }

        if (route === "/creditmodeler-service") {
          const sidebarBox = await measureElement(page.getByTestId("app-sidebar"));
          const treeBox = await measureElement(page.getByTestId("workbench-tree"));
          const canvasBox = await measureElement(page.getByTestId("workbench-canvas"));
          const stageCenterX = heroBox.x + heroBox.width / 2;
          const stageToWorkbenchGap = treeBox.y - (heroBox.y + heroBox.height);

          expect(isWithinTolerance(topbarBox.height, legacyWorkbenchTopbarHeight, legacyDesktopTolerance)).toBe(true);
          expect(isWithinTolerance(stageCenterX, viewport.width / 2, legacyDesktopTolerance)).toBe(true);
          expect(isWithinTolerance(stageToWorkbenchGap, legacyStageToWorkbenchGap, legacyDesktopTolerance)).toBe(true);
          expect(isWithinTolerance(treeBox.y, sidebarBox.y + 1, legacyDesktopTolerance)).toBe(true);
          expect(treeBox.x).toBeLessThan(canvasBox.x);
          expect(canvasBox.width).toBeGreaterThan(treeBox.width);
        }

        if (route === "/login") {
          const heroBox = await measureElement(page.getByTestId("page-hero"));
          const loginPanelBox = await measureElement(page.getByTestId("login-panel"));
          const loginFormBox = await measureElement(page.locator(".rv-login-form"));
          expect(loginPanelBox.x).toBeGreaterThanOrEqual(180);
          expect(loginPanelBox.x + loginPanelBox.width).toBeLessThanOrEqual(viewport.width - 180);
          expect(loginFormBox.y).toBeGreaterThan(heroBox.y + heroBox.height + 20);
          expect(loginPanelBox.y).toBeLessThanOrEqual(320);
        }

        if (route === "/applications") {
          const firstCardMenuButton = page.getByLabel("Reporting app options");
          const menuButtonBox = await measureElement(firstCardMenuButton);

          expect(menuButtonBox.width).toBeGreaterThanOrEqual(28);
          expect(menuButtonBox.width).toBeLessThanOrEqual(32);
          expect(menuButtonBox.height).toBeGreaterThanOrEqual(28);
          expect(menuButtonBox.height).toBeLessThanOrEqual(32);
        }

        if (route === "/services") {
          const toolbarBox = await measureElement(page.getByTestId("service-toolbar"));
          const gridBox = await measureElement(page.getByTestId("service-grid"));

          expect(toolbarBox.y).toBeLessThan(gridBox.y);
          expect(Math.abs(toolbarBox.width - gridBox.width)).toBeLessThanOrEqual(160);

          const heroBox = await measureElement(page.getByTestId("page-hero"));
          expect(heroBox.width).toBeGreaterThanOrEqual(800);

          const actionButtonBox = await measureElement(page.getByRole("button", { name: "Add New Service" }));
          expect(actionButtonBox.x).toBeGreaterThan(heroBox.x + heroBox.width);
        }

        if (route === "/creditmodeler-service") {
          await expect(page.locator(".rv-stagebar__item")).toHaveText(["DESIGN", "TEST", "DEPLOY", "RUN"]);
        }
      });
    }
  }
});
