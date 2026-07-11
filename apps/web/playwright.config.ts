import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/unit/**", "**/fixtures/**", "**/helpers/**"],
  snapshotPathTemplate: "{testDir}/visual/baselines/legacy/{arg}{ext}",
  outputDir: "./tests/visual/artifacts/comparison/test-results",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "./tests/visual/artifacts/comparison/report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
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
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    cwd: ".",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
