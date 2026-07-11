import path from "node:path";
import fs from "node:fs";

import { expect, test } from "@playwright/test";

import { assertLegacyBaselineExists } from "../helpers/compare-with-legacy";
import comparisonConfig from "../../playwright.config";
import legacyConfig from "../../playwright.legacy.config";

test.describe("@visual baseline governance", () => {
  test("fails when an approved baseline is missing", () => {
    expect(() => {
      assertLegacyBaselineExists("legacy-missing-route-desktop-standard.png");
    }).toThrow(/Missing approved legacy baseline/);
  });

  test("keeps comparison mode separate from explicit baseline generation", () => {
    expect(comparisonConfig.snapshotPathTemplate).toContain("baselines/legacy");
    expect(legacyConfig.snapshotPathTemplate).toContain("baselines/legacy");

    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["test:visual:desktop"]).not.toContain("--update-snapshots");
    expect(packageJson.scripts["test:visual"]).not.toContain("--update-snapshots");
    expect(packageJson.scripts["test:visual:legacy"]).toContain("--update-snapshots");
  });

  test("retains artifacts outside the approved baseline directory", () => {
    const comparisonOutputDir = path.normalize(String(comparisonConfig.outputDir));
    const legacyOutputDir = path.normalize(String(legacyConfig.outputDir));
    const approvedBaselinesDir = path.normalize(path.join("tests", "visual", "baselines", "legacy"));

    expect(comparisonOutputDir).not.toContain(approvedBaselinesDir);
    expect(legacyOutputDir).not.toContain(approvedBaselinesDir);
  });
});
