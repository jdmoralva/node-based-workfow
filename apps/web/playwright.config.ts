import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/unit/**", "**/fixtures/**", "**/helpers/**"],
  snapshotPathTemplate: "{testDir}/visual/__screenshots__/{arg}{ext}",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "off"
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
    reuseExistingServer: false,
    timeout: 120_000
  }
});
