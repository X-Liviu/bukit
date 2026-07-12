import { defineConfig, devices } from "@playwright/test";

// La URL base apuntará a apps/web cuando exista. Configurable por entorno para CI.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  // Cuando exista apps/web, descomenta para que Playwright arranque el server:
  // webServer: {
  //   command: "pnpm --filter @bukit/web dev",
  //   url: baseURL,
  //   reuseExistingServer: !process.env.CI,
  // },
});
