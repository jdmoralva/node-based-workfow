import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/visual/legacy-baseline.spec.ts"],
  testIgnore: ["**/unit/**", "**/fixtures/**", "**/helpers/**"],
  snapshotPathTemplate: "{testDir}/visual/baselines/legacy/{arg}{ext}",
  outputDir: "./tests/visual/artifacts/legacy-capture/test-results",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "./tests/visual/artifacts/legacy-capture/report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ],
  webServer: {
    command: "python -m http.server 4173 --bind 127.0.0.1",
    cwd: "../..",
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
