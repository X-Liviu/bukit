import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";

import { App, routes } from "./app";

// Arranque en el navegador (el index.ts de la API): el enrutador real, sobre
// la URL del navegador, y la app montada en el nodo raíz de index.html.
const root = document.getElementById("root");
if (!root) throw new Error("index.html no tiene el nodo #root");

createRoot(root).render(
  <StrictMode>
    <App router={createBrowserRouter(routes)} />
  </StrictMode>,
);
