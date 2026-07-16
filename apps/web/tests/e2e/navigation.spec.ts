import { test, expect } from "@playwright/test";

import { waitForStablePage } from "../helpers/wait-for-stable-page";
import { readBackendAuthSessionTestConfig } from "../helpers/auth-session";

const authTestConfig = readBackendAuthSessionTestConfig();

test.describe("protected-route navigation", () => {
  test("preserves next when redirected from a protected route", async ({ page }) => {
    await page.goto("/services");
    await waitForStablePage(page);

    await expect(page).toHaveURL(/\/login\?next=%2Fservices$/);
    await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
  });

  test("fails closed when a cookie exists but current-user validation cannot confirm the session", async ({ page }) => {
    await page.context().addCookies([
      {
        name: "rv_session",
        value: "test-session",
        domain: "127.0.0.1",
        path: "/"
      }
    ]);

    await page.goto("/creditmodeler-service");
    await waitForStablePage(page);

    await expect(page).toHaveURL(/\/login\?next=%2Fcreditmodeler-service$/);
    await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
  });
});

test.describe("backend-authenticated navigation", () => {
  test.skip(!process.env.E2E_AUTH_WITH_BACKEND, "Requires backend auth services and env wiring.");

  test("restores a safe intended route after successful sign-in", async ({ page }) => {
    await page.goto("http://localhost:3000/services");
    await waitForStablePage(page);

    await expect(page).toHaveURL(/\/login\?next=%2Fservices$/);

    await page.getByLabel("Username").fill(authTestConfig.username);
    await page.getByLabel("Password").fill(authTestConfig.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/services");
    await expect(page.getByRole("heading", { name: "SERVICES" })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/services$/);
    await waitForStablePage(page);
  });

  test("falls back to /applications for an unsafe next target", async ({ page }) => {
    await page.goto("http://localhost:3000/login?next=https://evil.example/path");
    await waitForStablePage(page);

    await page.getByLabel("Username").fill(authTestConfig.username);
    await page.getByLabel("Password").fill(authTestConfig.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/applications");
    await expect(page.getByRole("heading", { name: "APPLICATIONS" })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/applications$/);
    await waitForStablePage(page);
  });

  test("returns to /login and requires revalidation after logout and browser Back", async ({ page }) => {
    await page.goto("http://localhost:3000/applications");
    await waitForStablePage(page);

    await expect(page).toHaveURL(/\/login\?next=%2Fapplications$/);

    await page.getByLabel("Username").fill(authTestConfig.username);
    await page.getByLabel("Password").fill(authTestConfig.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/applications");
    await expect(page.getByRole("heading", { name: "APPLICATIONS" })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/applications$/);
    await waitForStablePage(page);
    await page.getByRole("button", { name: "Log out" }).click();

    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login$/);
    await waitForStablePage(page);
    await page.goBack();
    await waitForStablePage(page);

    await expect(page).toHaveURL(/\/login\?next=%2Fapplications$/);
    await expect(page.getByRole("heading", { name: "SIGN IN" })).toBeVisible();
  });
});
