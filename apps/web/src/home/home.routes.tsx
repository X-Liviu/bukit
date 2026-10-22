import type { RouteObject } from "react-router";

import type { Tab } from "../shell/app-shell";
import { HomePage } from "./home.page";

// La funcionalidad es dueña de su entrada en la barra y de sus rutas, como
// cada funcionalidad de la API es dueña de su router; app.tsx solo las reúne.
export const homeTab: Tab = { path: "/home", label: "Inicio" };

export const homeRoutes: RouteObject[] = [{ path: homeTab.path, element: <HomePage /> }];
