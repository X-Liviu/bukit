import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { replace, type DataRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";

import { homeRoutes, homeTab } from "./home/home.routes";
import { listsRoutes, listsTab } from "./lists/lists.routes";
import { messagesRoutes, messagesTab } from "./messages/messages.routes";
import { createQueryClient } from "./platform/query-client";
import { profileRoutes, profileTab } from "./profile/profile.routes";
import { AppShell } from "./shell/app-shell";
import { NotFoundPage } from "./shell/not-found.page";

// Composición de la app, el app.ts de la API: aquí, y solo aquí, lo común
// (armazón y TanStack Query) se junta con las funcionalidades. Las cuatro
// pestañas del producto, en el orden en que las ve la persona usuaria. `tabs`
// no se exporta (`routes` sí, para main.tsx y las pruebas, que no son
// funcionalidades): ninguna funcionalidad debe depender del punto de composición.
const tabs = [homeTab, listsTab, messagesTab, profileTab];

// Árbol de rutas: todo cuelga del armazón, que pinta la pestaña activa en su
// Outlet. La raíz redirige al inicio desde un loader, que el enrutador
// resuelve antes de pintar nada (con un <Navigate> se pintaría primero el
// armazón vacío y se navegaría después, dos veces bajo StrictMode); con
// replace y no redirect, para que «atrás» no vuelva a la raíz y esta
// redirija otra vez. Una ruta desconocida cae en la página «no encontrada»
// sin salir del armazón.
export const routes: RouteObject[] = [
  {
    element: <AppShell tabs={tabs} />,
    children: [
      { index: true, loader: () => replace(homeTab.path) },
      ...homeRoutes,
      ...listsRoutes,
      ...messagesRoutes,
      ...profileRoutes,
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

interface AppProps {
  // El enrutador lo crea quien monta la app: el del navegador en main.tsx y
  // uno en memoria en las pruebas, siempre sobre el mismo árbol de rutas.
  router: DataRouter;
}

// La app completa. El QueryClient nace con cada instancia (useState con
// función inicializadora), no con el módulo: cada prueba estrena su caché,
// como cada createApp de la API estrena sus contadores.
export function App({ router }: AppProps) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
