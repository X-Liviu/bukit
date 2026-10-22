import { defineConfig, devices } from "@playwright/test";

// La URL de la web: el puerto propio y estricto que fija apps/web/vite.config.ts.
// Con E2E_BASE_URL se prueba una web ya desplegada y no se arranca ninguna.
const externalURL = process.env.E2E_BASE_URL;
const baseURL = externalURL ?? "http://localhost:5180";

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
  // Playwright arranca la web (US-08) si no hay ya una sirviendo en baseURL;
  // en la CI siempre la arranca él. Cuando entren en la CI (EP12), valorar
  // `vite preview` sobre una build: lo desplegado es el bundle, no el
  // servidor de desarrollo.
  webServer: externalURL
    ? undefined
    : {
        command: "pnpm --filter @bukit/web dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
