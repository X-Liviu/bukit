import { test, expect } from "@playwright/test";

// Prueba de humo de la web (US-08): la app arranca y responde. Los flujos
// reales llegan con EP12. Necesita los navegadores de Playwright instalados
// (pnpm --filter @bukit/e2e exec playwright install).
test("la web carga y muestra las cuatro pestañas", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/BUKIT/);
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("navigation", { name: "Pestañas" }).getByRole("link")).toHaveText([
    "Inicio",
    "Listas",
    "Mensajes",
    "Perfil",
  ]);
});
