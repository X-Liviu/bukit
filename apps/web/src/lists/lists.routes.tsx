import type { RouteObject } from "react-router";

import type { Tab } from "../shell/app-shell";
import { ListsPage } from "./lists.page";

export const listsTab: Tab = { path: "/lists", label: "Listas" };

// Aquí irán las subrutas de EP04 (una lista, su edición) bajo este prefijo.
export const listsRoutes: RouteObject[] = [{ path: listsTab.path, element: <ListsPage /> }];
