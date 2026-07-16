import fs from "node:fs";
import path from "node:path";

import { expect, type Page } from "@playwright/test";

import { getLegacyBaselineFileName, type LegacyRouteKey } from "../fixtures/legacy-routes";

export function getLegacyBaselinePath(fileName: string): string {
  const cwd = process.cwd();
  const appRoot = cwd.endsWith(path.join("apps", "web")) ? cwd : path.join(cwd, "apps", "web");

  return path.join(appRoot, "tests", "visual", "baselines", "legacy", fileName);
}

export function assertLegacyBaselineExists(fileName: string): string {
  const baselinePath = getLegacyBaselinePath(fileName);

  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Missing approved legacy baseline: ${fileName}`);
  }

  return baselinePath;
}

export async function comparePageWithLegacy(page: Page, routeKey: LegacyRouteKey, viewportLabel: string): Promise<void> {
  const baselineFileName = getLegacyBaselineFileName(routeKey, viewportLabel);
  assertLegacyBaselineExists(baselineFileName);

  await expect(page).toHaveScreenshot(baselineFileName, {
    animations: "disabled",
    fullPage: true,
    maxDiffPixelRatio: 0.02
  });
}
