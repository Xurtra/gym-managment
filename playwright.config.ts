import { defineConfig, devices } from "@playwright/test";

const observableMode = process.env.PLAYWRIGHT_OBSERVABLE === "1" || process.env.PW_OBSERVABLE === "1";
const observableDelayMs = positiveIntegerFromEnv("PLAYWRIGHT_OBSERVABLE_DELAY_MS", 400);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: !observableMode,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI || observableMode ? 1 : undefined,
  reporter: process.env.CI ? [["html", { outputFolder: "playwright-report" }], ["list"]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: observableMode ? "on" : "on-first-retry",
    headless: !observableMode,
    ...(observableMode
      ? {
          launchOptions: {
            slowMo: observableDelayMs
          }
        }
      : {})
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "npm run dev:api",
      url: "http://127.0.0.1:4000/health",
      reuseExistingServer: !process.env.CI && !observableMode,
      timeout: 30_000
    },
    {
      command: "npm run dev:frontend",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI && !observableMode,
      timeout: 30_000
    }
  ]
});

function positiveIntegerFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
