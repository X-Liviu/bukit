import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderApp } from "./helpers";

// Pruebas de la app montada entera (US-08): el enrutado de las cuatro
// pestañas de punta a punta, sobre el enrutador en memoria de helpers.tsx.
// Las pestañas se escriben aquí tal como las ve la persona usuaria, no se
// importan de los *.routes.tsx: la prueba debe fallar si cambian.
const tabs = [
  { path: "/home", label: "Inicio" },
  { path: "/lists", label: "Listas" },
  { path: "/messages", label: "Mensajes" },
  { path: "/profile", label: "Perfil" },
];

describe("enrutado de las cuatro pestañas", () => {
  it("la raíz redirige a la pestaña de inicio sin dejar rastro en el historial", async () => {
    const { router } = renderApp("/");

    expect(await screen.findByRole("heading", { level: 2, name: "Inicio" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/home");
    // Volver atrás no debe llevar a «/» para que esta redirija otra vez.
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("el armazón tiene cabecera con el nombre del producto, barra de pestañas y contenido", async () => {
    renderApp("/home");

    expect(await screen.findByRole("heading", { level: 1, name: "BUKIT" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Pestañas" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("la barra lleva las cuatro pestañas del producto, en su orden", async () => {
    renderApp("/");

    const nav = await screen.findByRole("navigation", { name: "Pestañas" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(tabs.map((tab) => tab.label));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(tabs.map((tab) => tab.path));
  });

  it.each(tabs)("$path carga directamente la pestaña «$label»", async ({ path, label }) => {
    renderApp(path);

    expect(await screen.findByRole("heading", { level: 2, name: label })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(document.title).toBe(`${label} · BUKIT`);
  });

  it("pulsar una pestaña cambia la pantalla y la marca como actual, y atrás deshace", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/home");

    await user.click(await screen.findByRole("link", { name: "Listas" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Listas" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/lists");
    expect(screen.getByRole("link", { name: "Listas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");

    await router.navigate(-1);

    expect(await screen.findByRole("heading", { level: 2, name: "Inicio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
  });

  it("una subruta que aún no existe cae en «Página no encontrada», con su pestaña activa", async () => {
    renderApp("/lists/algo");

    expect(
      await screen.findByRole("heading", { level: 2, name: "Página no encontrada" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Listas" })).toHaveAttribute("aria-current", "page");
  });

  it("una ruta desconocida muestra «Página no encontrada» dentro del armazón y vuelve al inicio", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/no-existe");

    expect(
      await screen.findByRole("heading", { level: 2, name: "Página no encontrada" }),
    ).toBeInTheDocument();
    // El armazón sigue ahí: la persona no se queda sin pestañas.
    expect(screen.getByRole("navigation", { name: "Pestañas" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Volver al inicio" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Inicio" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/home");
  });
});
