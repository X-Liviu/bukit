# apps/web

Cliente web de BUKIT: **React 19 + Vite 8 + TypeScript**, con **React Router 8** para las cuatro pestañas y **TanStack Query** para el estado de servidor. El estado global de interfaz (Redux Toolkit con Reselect u otra opción) sigue **en consideración** hasta el primer estado global real (cap. 6 de la memoria).

## Comandos

```bash
pnpm web:dev                        # servidor de desarrollo en http://localhost:5180 (desde la raíz)
pnpm --filter @bukit/web build      # build de producción en dist/
pnpm --filter @bukit/web test       # pruebas: Vitest + Testing Library sobre jsdom
pnpm --filter @bukit/web typecheck
pnpm test:e2e                       # prueba de humo en navegador: Playwright arranca la web si no hay una en el 5180
                                    # (la primera vez: pnpm --filter @bukit/e2e exec playwright install)
```

El puerto **5180 es fijo y estricto** (`vite.config.ts`): el 5173 de serie lo puede ocupar otro servidor de desarrollo, y Vite saltaría en silencio a otro puerto mientras Playwright probaría la app equivocada (ocurrió en la US-08). Si el 5180 está ocupado, Vite falla y se ve.

## Estructura del código

Organizada por funcionalidad, con las mismas reglas que la API (`apps/api/README.md`): cada pestaña del producto es una funcionalidad.

```
src/
  main.tsx, app.tsx   arranque en el navegador y composición de la app
  platform/           lo común de infraestructura: hoy query-client.ts (caché de TanStack Query);
                      después, el cliente de la API y config.ts
  shell/              armazón con la barra de pestañas (app-shell.tsx) y página «no encontrada»
  home/, lists/,      una carpeta por pestaña: *.page.tsx y *.routes.tsx
  messages/, profile/
```

- **Regla de dependencias**: lo común (`platform/`, `shell/`) no importa de ninguna funcionalidad; una funcionalidad usará los _hooks_ de otra, nunca sus páginas ni sus rutas; `app.tsx` es el único sitio que las reúne.
- **Rutas**: cada funcionalidad declara su pestaña (`homeTab`) y sus rutas (`homeRoutes`) en su `*.routes.tsx`, y `app.tsx` las monta bajo el armazón, como `app.ts` monta los routers de la API. Las rutas son identificadores en inglés (`/home`, `/lists`, `/messages`, `/profile`), como las de la API; los textos que lee la persona, en español. La raíz redirige a `/home` y cualquier otra ruta cae en la página «no encontrada», dentro del armazón.
- **Las páginas solo componen**: llaman a _hooks_ y pintan. Las reglas del producto irán a los _hooks_ de consulta de cada funcionalidad (por ejemplo `lists/lists.queries.ts`, sobre TanStack Query) y a `packages/ui-core`; el acceso a la API, a `platform/api-client.ts` (la instancia de `@bukit/api-client` configurada con la URL base que lee `config.ts`, el único módulo que leerá `import.meta.env`). Llegan con la US-09.
- **Estado por instancia**: lo que guarda estado se crea por instancia, nunca en el módulo. El enrutador lo crea quien monta la app (`createBrowserRouter` en `main.tsx`; uno en memoria en las pruebas) y el `QueryClient` nace con cada `<App>`. Las rutas, sin estado, son constantes.
- **Dependencias**: solo las que se importan. `@bukit/core`, `@bukit/api-client` y `@bukit/ui-core` entran con su primer uso.
- **Pruebas** en `tests/`, en espejo de `src/`: `app.test.tsx` (el enrutado de punta a punta, como lo ve la persona), `shell/`, el ayudante `helpers.tsx` (`renderApp(path)` estrena enrutador y app en cada prueba, como `createApp` en la API) y `setup.ts` (comparadores del DOM y limpieza entre pruebas).
- Diferencias con la API, por correr en el navegador: imports sin extensión (resolución del empaquetador), `main.tsx` en lugar de `index.ts`, y `vite.config.ts` reúne la configuración de Vite y de Vitest.
