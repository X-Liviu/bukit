import { test, expect } from "@playwright/test";

// Test de humo de ejemplo. Se sustituirá por los flujos reales cuando exista apps/web.
test.skip("la home carga", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/BUKIT/i);
});
