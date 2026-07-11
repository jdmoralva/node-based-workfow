import { test, expect } from "@playwright/test";

const routeCases = [
  { path: "/", heading: "APPLICATIONS" },
  { path: "/login", heading: "SIGN IN" },
  { path: "/applications", heading: "APPLICATIONS" },
  { path: "/services", heading: "SERVICES" },
  { path: "/creditmodeler-service", heading: null, text: "CreditModeler" }
] as const;

test.describe("direct migrated route loading", () => {
  for (const routeCase of routeCases) {
    test(`loads ${routeCase.path} directly`, async ({ page }) => {
      await page.goto(routeCase.path);

      if (routeCase.heading) {
        await expect(page.getByRole("heading", { name: routeCase.heading })).toBeVisible();
      }

      if ("text" in routeCase) {
        await expect(page.getByText(routeCase.text)).toBeVisible();
      }
    });
  }
});
