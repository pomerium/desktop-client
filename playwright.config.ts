import { defineConfig } from "@playwright/test";

// The app holds a single-instance lock (src/main/index.ts), so tests must
// never launch two copies at once: run one worker, one test at a time.
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  outputDir: "./test-results/e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [["list"], ["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
