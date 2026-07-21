import { expect, test } from "@playwright/test";

import { requiredViewports } from "../helpers/viewports";
import { createAuthenticatedStorageState } from "../helpers/auth-session";
import { measureElement } from "../helpers/measure-layout";
import { waitForStablePage } from "../helpers/wait-for-stable-page";

const viewportCases = [
  ["tablet", requiredViewports.tablet],
  ["mobile", requiredViewports.mobile]
] as const;

test.describe("responsive usability details", () => {
  for (const [viewportLabel, viewport] of viewportCases) {
    test(`landing keeps hero and application cards readable at ${viewportLabel}`, async ({ page, request }) => {
      test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

      const storageState = await createAuthenticatedStorageState(request);
      await page.context().addCookies(storageState.cookies);
      await page.setViewportSize(viewport);
      await page.goto("/");
      await waitForStablePage(page);

      const heroBox = await measureElement(page.getByTestId("page-hero"));
      const firstCard = await measureElement(page.getByTestId("application-card-Reporting"));
      const secondCard = await measureElement(page.getByTestId("application-card-AI Copilot"));

      expect(firstCard.y).toBeGreaterThan(heroBox.y + heroBox.height - 4);

      if (viewportLabel === "tablet") {
        expect(Math.abs(firstCard.y - secondCard.y)).toBeLessThanOrEqual(8);
      } else {
        expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 8);
      }
    });

    test(`applications keep a deliberate grid at ${viewportLabel}`, async ({ page, request }) => {
      test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

      const storageState = await createAuthenticatedStorageState(request);
      await page.context().addCookies(storageState.cookies);
      await page.setViewportSize(viewport);
      await page.goto("/applications");
      await waitForStablePage(page);

      const firstCard = await measureElement(page.getByTestId("application-card-Reporting"));
      const secondCard = await measureElement(page.getByTestId("application-card-AI Copilot"));

      if (viewportLabel === "tablet") {
        expect(Math.abs(firstCard.y - secondCard.y)).toBeLessThanOrEqual(8);
      } else {
        expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 8);
      }
    });

    test(`services keep toolbar actions and readable card flow at ${viewportLabel}`, async ({ page, request }) => {
      test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

      const storageState = await createAuthenticatedStorageState(request);
      await page.context().addCookies(storageState.cookies);
      await page.setViewportSize(viewport);
      await page.goto("/services");
      await waitForStablePage(page);

      await expect(page.getByRole("button", { name: "Add New Service" })).toBeVisible();

      const toolbarBox = await measureElement(page.getByTestId("service-toolbar"));
      const firstCard = await measureElement(page.getByTestId("service-card-CreditModeler"));

      expect(firstCard.y).toBeGreaterThan(toolbarBox.y + toolbarBox.height - 4);
    });

    test(`login form stays fully usable at ${viewportLabel}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await waitForStablePage(page);

      await expect(page.getByLabel("Username")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

      const panelBox = await measureElement(page.getByTestId("login-panel"));
      expect(panelBox.width).toBeLessThanOrEqual(viewport.width - 24);
    });

    test(`creditmodeler keeps stage, tree, and canvas usable at ${viewportLabel}`, async ({ page, request }) => {
      test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

      const storageState = await createAuthenticatedStorageState(request);
      await page.context().addCookies(storageState.cookies);
      await page.setViewportSize(viewport);
      await page.goto("/creditmodeler-service");
      await waitForStablePage(page);

      const stageBarBox = await measureElement(page.getByTestId("stage-bar"));
      const treeBox = await measureElement(page.getByTestId("workbench-tree"));
      const canvasBox = await measureElement(page.getByTestId("workbench-canvas"));

      expect(stageBarBox.width).toBeLessThanOrEqual(viewport.width - 24);
      expect(treeBox.y).toBeGreaterThanOrEqual(stageBarBox.y + stageBarBox.height - 4);
      expect(canvasBox.y).toBeGreaterThan(treeBox.y + treeBox.height - 4);
    });

    test(`data model builder stacks sections and keeps primary actions usable at ${viewportLabel}`, async ({ page, request }) => {
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

      const setupPanel = page.getByRole("region", { name: "Model setup" });
      const previewPanel = page.getByRole("region", { name: "Model preview" });
      const setupBox = await measureElement(setupPanel);
      const previewBox = await measureElement(previewPanel);

      expect(previewBox.y).toBeGreaterThan(setupBox.y + setupBox.height - 4);
      await expect(page.getByRole("button", { name: "Save Draft" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Test model" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Test model" })).toBeEnabled();
    });
  }
});
