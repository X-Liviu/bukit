import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../src/shell/app-shell";

// El armazón no conoce las funcionalidades: pinta las pestañas que recibe y
// marca la activa según la ruta. Se prueba con pestañas inventadas, no con las
// de la app, para que un cambio en una funcionalidad no rompa esta prueba.
const tabs = [
  { path: "/una", label: "Una" },
  { path: "/otra", label: "Otra" },
];

function renderShell(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <AppShell tabs={tabs} />,
        children: tabs.map((tab) => ({
          path: tab.path,
          element: <p>Contenido de {tab.label}</p>,
        })),
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe("AppShell", () => {
  it("pinta las pestañas recibidas, en orden, y el contenido de la ruta activa", async () => {
    renderShell("/otra");

    expect(await screen.findByText("Contenido de Otra")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Una", "Otra"]);
  });

  it("marca como actual solo la pestaña de la ruta activa", async () => {
    renderShell("/otra");

    expect(await screen.findByRole("link", { name: "Otra" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Una" })).not.toHaveAttribute("aria-current");
  });
});
