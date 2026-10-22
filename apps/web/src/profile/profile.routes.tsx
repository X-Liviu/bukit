import type { RouteObject } from "react-router";

import type { Tab } from "../shell/app-shell";
import { ProfilePage } from "./profile.page";

export const profileTab: Tab = { path: "/profile", label: "Perfil" };

export const profileRoutes: RouteObject[] = [{ path: profileTab.path, element: <ProfilePage /> }];
