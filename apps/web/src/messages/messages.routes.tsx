import type { RouteObject } from "react-router";

import type { Tab } from "../shell/app-shell";
import { MessagesPage } from "./messages.page";

export const messagesTab: Tab = { path: "/messages", label: "Mensajes" };

export const messagesRoutes: RouteObject[] = [
  { path: messagesTab.path, element: <MessagesPage /> },
];
