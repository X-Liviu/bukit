# Diagramas y mapa del proyecto

`bukit.drawio` se abre directamente con draw.io (escritorio: **Archivo → Abrir**). **Todos los diagramas siguen la notación UML 2.5**, regla del autor desde el 04-10-2026 (ver CLAUDE.md, «Memoria del TFG»): el modelo de datos se dibuja como diagrama de clases, no como entidad-relación. Cada página trae una nota «Cómo se lee» con la notación que usa. **Todo cambio del modelo de datos actualiza estos diagramas en la misma historia** (regla del autor desde el 10-10-2026): el de clases y las demás vistas que expliquen la arquitectura afectada. Tiene seis páginas (pestañas abajo):

1. **Clases: modelo de datos** — `User` (tabla `users`) con su enumeración `UserTier`, y `RefreshToken` (tabla `refresh_tokens`, US-06) en composición con `User` (1 a 0..*) y con la autoasociación `replacedBy`/`replaces` (0..1). Notas con la correspondencia en la base (cascada, índices) y las tablas que crean solas las herramientas, que no forman parte del modelo.
2. **Secuencia: iniciar y cerrar sesión** — dos interacciones (`sd`) entre cliente, API y PostgreSQL: el inicio de sesión guarda la huella del token en una familia nueva y borra los caducados del usuario; el cierre de sesión anula la familia (fragmento `opt`).
3. **Secuencia: renovar la sesión** — la rotación del token de refresco con sus alternativas (`alt`): renovación normal, carrera entre dos renovaciones simultáneas, reutilización de un token ya renovado (posible robo) y rechazos.
4. **Despliegue** — nodos, entornos de ejecución y artefactos: portátil (Node.js + Docker), GitHub (repositorio + Actions), Render y Neon, con las rutas de comunicación y su protocolo.
5. **Actividad: de un push a producción** — el flujo de la CI/CD por calles (autor, GitHub Actions y Render): bifurcación y unión de los jobs en paralelo y decisiones (falla, PR o push a `main`).
6. **Paquetes: monorepo** — `apps`, `packages` y `e2e` con sus dependencias «use» (en gris, las futuras). El color indica qué paquete tiene código, cuál es esqueleto y cuál está vacío.

Generado el 04-10-2026 a partir del estado real del repositorio y de la base local; actualizado el 10-10-2026 con la US-06 (páginas 1 a 3) y Node 24.21 (página 4), y el 21-10-2026 con la US-08 (página 6: la web pasa a tener código). **El `.drawio` es la fuente**: se refina a mano en draw.io. Para la memoria, se exporta la página que haga falta a PDF o PNG en `docs/thesis/figures/`.

## Librerías y herramientas: qué es cada una y para qué sirve

Versiones exactas a 15-11-2026 (las fija el `pnpm-lock.yaml`; ver los `package.json`).

### La API (`apps/api`), lo que se ejecuta en producción

| Paquete              | Versión | Para qué sirve                                                                                                                                                                                            |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `express`            | 5.3.0   | El servidor HTTP: define las rutas (`/health`, `/auth/...`) y los _middlewares_.                                                                                                                          |
| `@prisma/client`     | 6.1.0   | El cliente generado desde `schema.prisma` para leer y escribir en PostgreSQL sin SQL a mano.                                                                                                              |
| `zod`                | 4.6.7   | En la API, reconoce los errores de validación y los convierte en un 400 (los esquemas viven en `packages/core`).                                                                                          |
| `@bukit/core`        | propio  | Los esquemas Zod y tipos compartidos: valida el registro, el inicio de sesión y las peticiones de renovar o cerrar sesión, y da forma a los errores.                                                      |
| `bcryptjs`           | 3.0.3   | Hace el hash bcrypt de la contraseña (12 rondas, configurable con `BCRYPT_ROUNDS`) y la comprueba al iniciar sesión.                                                                                      |
| `jsonwebtoken`       | 9.0.3   | Firma y verifica los tokens JWT (HS256): acceso de 15 min y refresco de 30 días. Desde la US-06, el de refresco se guarda por su huella SHA-256 y rota en cada uso.                                       |
| `pino`               | 10.4.0  | El registro de sucesos (_logs_) en JSON, tapando secretos (cabecera `Authorization`, cookies…) y la IP del cliente con las cabeceras de proxy que la llevan.                                              |
| `pino-http`          | 11.0.0  | Registra cada petición HTTP que llega (ruta, código, tiempo).                                                                                                                                             |
| `express-rate-limit` | 8.7.1   | La doble capa de limitación de peticiones (US-07): 20 peticiones por IP cada 15 min en el alta y el inicio de sesión, y 5 intentos por cuenta e IP en el inicio de sesión, con los contadores en memoria. |
| `cors`               | 2.8.6   | Permite que un navegador de otro dominio (la web, cuando llame a la API en la US-09) llame a la API; hoy abierto a cualquier origen.                                                                      |
| `dotenv`             | 18.0.10 | Carga el `.env` en local (`DATABASE_URL`, `PORT`); en producción las variables las pone Render.                                                                                                           |
| `tsx`                | 4.23.15 | Ejecuta TypeScript sin compilar: así arranca la API en local (`pnpm dev`) y en el contenedor de Render.                                                                                                   |

### Desarrollo y pruebas de la API

| Paquete                                                                    | Versión | Para qué sirve                                                                                                             |
| -------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `prisma` (CLI)                                                             | 6.1.0   | Genera el cliente, crea y aplica migraciones, abre Prisma Studio y lanza la semilla.                                       |
| `vitest`                                                                   | 5.0.5   | Ejecuta las pruebas (en la API, `packages/core` y `apps/web`); en la API, archivo a archivo porque comparten la base real. |
| `supertest`                                                                | 7.2.2   | Lanza peticiones HTTP contra la app en memoria, sin abrir puerto, para las pruebas de integración.                         |
| `pino-pretty`                                                              | 13.1.3  | Muestra los _logs_ legibles en la consola en desarrollo (en producción salen en JSON).                                     |
| `@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/supertest` | —       | Tipos de TypeScript de esas librerías (solo los usa el compilador).                                                        |

### El cliente web (`apps/web`): lo que corre en el navegador y lo que lo sirve y construye

| Paquete                 | Versión | Para qué sirve                                                                                                                       |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `react`, `react-dom`    | 19.3.1  | La biblioteca de interfaz y su montaje en el navegador.                                                                              |
| `react-router`          | 8.5.0   | El enrutado (US-08): las cuatro pestañas como rutas anidadas bajo el armazón, la redirección de la raíz y la página «no encontrada». |
| `@tanstack/react-query` | 5.107.1 | La caché del estado de servidor (consultas, reintentos, paginación infinita); hoy solo su proveedor, sin consultas aún.              |
| `vite`                  | 8.3.5   | Sirve la web en desarrollo (puerto 5180, fijo y estricto) y construye la de producción.                                              |
| `@vitejs/plugin-react`  | 6.3.0   | Enseña a Vite a compilar JSX y a recargar componentes sin perder su estado.                                                          |

### Desarrollo y pruebas de la web

| Paquete                                          | Versión         | Para qué sirve                                                                                    |
| ------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------- |
| `vitest`                                         | 5.0.5           | Ejecuta las pruebas sobre un DOM simulado, con la misma configuración de Vite (`vite.config.ts`). |
| `@testing-library/react`, `@testing-library/dom` | 16.3.3 / 10.4.2 | Renderiza componentes en las pruebas y los consulta como lo haría la persona (roles, textos).     |
| `@testing-library/user-event`                    | 14.6.8          | Simula pulsaciones y teclado en las pruebas.                                                      |
| `@testing-library/jest-dom`                      | 7.0.1           | Comparadores del DOM para `expect` (`toBeInTheDocument`, `toHaveAttribute`…).                     |
| `jsdom`                                          | 30.1.3          | El DOM simulado en el que corren las pruebas.                                                     |
| `@types/react`, `@types/react-dom`               | 19.3.0          | Tipos de React (solo los usa el compilador).                                                      |

### Paquetes compartidos

| Pieza                 | Estado     | Contenido                                                                                                                        |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `packages/core`       | con código | `zod` 4.6.7: esquemas de usuario, inicio de sesión, listas y metas y errores de la API. Pruebas con `vitest`.                    |
| `packages/api-client` | esqueleto  | Futuro cliente HTTP tipado para web y móvil. Declara `@bukit/core`, pero aún no lo usa.                                          |
| `packages/ui-core`    | esqueleto  | Futura lógica de interfaz compartida. Declara `@bukit/core`, pero aún no lo usa.                                                 |
| `e2e`                 | con código | `@playwright/test` 1.63.0: prueba de humo de la web en navegador (arranca la web en el 5180); los flujos reales llegan con EP12. |

### Calidad de código (raíz del monorepo)

| Paquete                     | Versión | Para qué sirve                                                                                                                |
| --------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `typescript`                | 6.0.3   | Comprueba los tipos de todo el monorepo (`pnpm typecheck`). La API no se compila: se ejecuta con `tsx`.                       |
| `eslint`                    | 10.13.0 | Detecta errores y malas prácticas antes de ejecutar nada; es la primera barrera de la CI.                                     |
| `@eslint/js`                | 10.0.1  | Las reglas recomendadas de JavaScript para ESLint.                                                                            |
| `typescript-eslint`         | 8.71.1  | Hace que ESLint entienda TypeScript y añade reglas propias.                                                                   |
| `eslint-config-prettier`    | 10.1.8  | Apaga las reglas de ESLint que chocarían con Prettier.                                                                        |
| `eslint-plugin-react-hooks` | 7.1.1   | Las reglas de los hooks de React, solo en `apps/web`.                                                                         |
| `globals`                   | 17.13.0 | Las variables globales de Node (API, paquetes, e2e) y del navegador (web), para que ESLint no las marque como «no definidas». |
| `prettier`                  | 3.9.10  | Formatea el código automáticamente con un estilo único.                                                                       |
| `@types/node`               | 24.19.1 | Tipos de Node (los de la versión 24, la que se ejecuta).                                                                      |

### Herramientas y servicios

| Herramienta                                   | Versión                                                                          | Para qué sirve                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Node.js                                       | 24.21.0 (campo `volta` de `package.json`)                                        | Ejecuta la API, las pruebas y todas las herramientas JavaScript.                                             |
| pnpm (vía Corepack)                           | 9.15.0                                                                           | Instala dependencias, enlaza los paquetes del monorepo y lanza los scripts.                                  |
| Docker Desktop + Docker Compose               | 29.8.2 / 5.6.0                                                                   | Levanta la base de datos local y construye la imagen de la API.                                              |
| Imagen propia de Postgres (`docker/postgres`) | PostgreSQL 16.15 + PostGIS 3.3.10 + pgvector 0.8.0                               | La base local y la de la CI, con las mismas versiones que producción (Neon).                                 |
| PostGIS                                       | 3.3.10                                                                           | Extensión geográfica para el futuro mapa (búsqueda por cercanía). Instalada, aún sin uso.                    |
| pgvector                                      | 0.8.0                                                                            | Extensión para comparar _embeddings_ en la futura afinidad entre personas. Instalada, aún sin uso.           |
| GitHub Actions                                | —                                                                                | La CI: `lint` (+ `pnpm audit`) → `typecheck` → `test`, `docker` en paralelo y `migrate` (solo en `main`).    |
| Acciones de la CI                             | checkout v7, setup-node v7, pnpm/action-setup v6, setup-buildx v4, build-push v7 | Descargar el código, preparar Node y pnpm y construir la imagen de Postgres con caché.                       |
| Dependabot                                    | —                                                                                | Propone cada semana PRs de actualización (npm, máx. 5 abiertas; acciones de GitHub, máx. 3).                 |
| Render                                        | plan gratuito, Fráncfort                                                         | Aloja la API en producción; solo despliega con todos los checks de la CI en verde.                           |
| Neon                                          | PostgreSQL 16.15, Fráncfort                                                      | La base de datos de producción.                                                                              |
| Git + GitHub CLI (`gh`)                       | 2.54 / 2.96                                                                      | Versiones, repositorio, secretos de la CI y PRs desde la terminal.                                           |
| MiKTeX (`pdflatex`) + `biber`                 | 25.12 / 2.21                                                                     | Compilan la memoria LaTeX y su bibliografía APA (`latexmk` no funciona en este equipo: falta Perl).          |
| VS Code + Claude Code                         | —                                                                                | Editor (formatea con Prettier, corrige con ESLint, compila la memoria al guardar) y asistente de desarrollo. |
| graphify                                      | 0.9.13                                                                           | Grafo del código para orientarse antes de leer archivos (lo usa Claude Code).                                |
