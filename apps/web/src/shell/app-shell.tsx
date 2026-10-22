import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";

// Una pestaña de la barra: la ruta es un identificador (en inglés, como las
// rutas de la API) y el texto es lo que lee la persona usuaria.
export interface Tab {
  path: string;
  label: string;
}

interface AppShellProps {
  tabs: readonly Tab[];
}

// Armazón común de la web: la barra con las pestañas del producto y el hueco
// (Outlet) donde el enrutador pinta la activa. No sabe qué pestañas existen:
// las recibe de app.tsx, igual que el app.ts de la API monta los routers de
// cada funcionalidad sin que lo común dependa de ninguna. NavLink, sin `end`,
// marca con aria-current="page" la pestaña de la ruta actual y de sus
// subrutas (el mismo criterio por prefijo que `active`).
export function AppShell({ tabs }: AppShellProps) {
  const { pathname } = useLocation();
  // La pestaña activa, por prefijo: sus subrutas (/lists/…) siguen siendo ella.
  const active = tabs.find((tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`));

  // En una SPA la página no se recarga al navegar, y el título del documento
  // es lo que anuncia un lector de pantalla: cambia con la pestaña; fuera de
  // ellas (ruta desconocida), solo el nombre del producto.
  useEffect(() => {
    document.title = active ? `${active.label} · BUKIT` : "BUKIT";
  }, [active]);

  return (
    <>
      <header>
        <h1>BUKIT</h1>
        <nav aria-label="Pestañas">
          <ul>
            {tabs.map((tab) => (
              <li key={tab.path}>
                <NavLink to={tab.path}>{tab.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
