import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

test.describe("desktop visual repeatability governance", () => {
  test("defines a comparison-only command for two consecutive desktop comparison runs", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };

    const repeatabilityCommand = packageJson.scripts["test:visual:repeatability"];

    expect(repeatabilityCommand).toBeDefined();
    expect(repeatabilityCommand.match(/npm run test:visual:desktop/g)).toHaveLength(2);
    expect(repeatabilityCommand).not.toContain("--update-snapshots");
    expect(repeatabilityCommand).not.toContain("test:visual:legacy");
  });
});
