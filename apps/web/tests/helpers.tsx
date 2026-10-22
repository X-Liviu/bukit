import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter } from "react-router";

import { App, routes } from "../src/app";

// Monta la app completa en una ruta, con un enrutador en memoria (sin la URL
// del navegador) nuevo en cada llamada: cada prueba parte de cero, como cada
// prueba de la API estrena su createApp. Bajo StrictMode, como en main.tsx,
// para que las pruebas vean los dobles renders y efectos que vería el
// navegador en desarrollo. Devuelve el enrutador para comprobar la ruta en la
// que acaba y mover el historial.
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    router,
    ...render(
      <StrictMode>
        <App router={router} />
      </StrictMode>,
    ),
  };
}
