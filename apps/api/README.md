# @bukit/api

Servidor de BUKIT: API REST con Express 5 sobre Node, Prisma como acceso a datos (modelos aún en diseño incremental) y contrato de errores compartido desde `@bukit/core`.

## Comandos

Desde la raíz del monorepo:

```bash
pnpm --filter @bukit/api dev    # desarrollo con recarga (tsx watch)
pnpm --filter @bukit/api test   # pruebas de integración (Vitest + Supertest)
pnpm --filter @bukit/api start  # arranque tipo producción (tsx src/index.ts)
```

La comprobación de vida es `GET /health` → `{ "status": "ok" }`.

Las pruebas son de integración contra un Postgres real: necesitan `pnpm db:up` (desde la raíz) y el esquema migrado. Vacían tablas en su `beforeEach`, así que **se niegan a ejecutarse si `DATABASE_URL` no apunta a `localhost`** (guarda en `tests/setup.ts`, añadida el 10-10-2026 al existir ya la base de producción).

## Variables de entorno

En local se cargan desde un `.env` en esta carpeta (vía `dotenv`); en Render se definen en el servicio (el Blueprint fija las estáticas).

| Variable        | Obligatoria                   | Secreta | Descripción                                                                                                                                                                                                                                                                |
| --------------- | ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | Sí (para las rutas con datos) | Sí      | Cadena de conexión de PostgreSQL. En local, el Postgres de Docker (ver `.env.example`). En producción, Neon: el valor vive solo en el panel de Render (`sync: false` en `render.yaml`) y en el secreto `DATABASE_URL_PRODUCCION` de GitHub, que usa el job de migraciones. |
| `JWT_SECRET`    | En producción                 | Sí      | Secreto de firma de los tokens (mínimo 32 caracteres; uno más corto es un error en cualquier entorno). En local hay uno de desarrollo; en Render lo genera el Blueprint (`generateValue`).                                                                                 |
| `PORT`          | No                            | No      | Puerto de escucha. Render la inyecta automáticamente; en local, 3001 de reserva.                                                                                                                                                                                           |
| `NODE_ENV`      | No                            | No      | `production` en despliegue (logs JSON puros); `development` en local (pino-pretty).                                                                                                                                                                                        |
| `LOG_LEVEL`     | No                            | No      | Nivel del registro de sucesos de pino; por defecto `debug` en desarrollo e `info` en producción.                                                                                                                                                                           |
| `BCRYPT_ROUNDS` | No                            | No      | Coste del hash de contraseñas; por defecto 12. Las pruebas lo bajan a 4 para ir rápido.                                                                                                                                                                                    |

Los secretos nunca entran en el repositorio: el `.env` y sus variantes (`.env.*`, salvo `.env.example`) están en `.gitignore` y en `.dockerignore`.

## Despliegue continuo (US-03)

- **Destino: Render** (región Fráncfort, plan gratuito). Decisión y alternativas descartadas (Railway, Fly.io) en el dev-journal del 06-08-2026 y en la memoria.
- **Infraestructura como código**: el servicio se define en el [`render.yaml`](../../render.yaml) de la raíz (Blueprint). Para crearlo la primera vez: Render → New → Blueprint → conectar este repositorio → Apply.
- **La imagen** se construye con el [`Dockerfile`](./Dockerfile) de esta carpeta, con la raíz del monorepo como contexto. El contenedor ejecuta la API con `tsx` porque los paquetes compartidos se consumen sin compilar (decisión del esqueleto, comentada en el propio Dockerfile).
- **Despliegue solo con la CI en verde**: `autoDeployTrigger: checksPass` — Render espera a los checks de GitHub Actions del commit y no despliega si alguno falla o si no hay checks.
- **Base de datos de producción: Neon** (región Fráncfort, PostgreSQL 16.15 con PostGIS 3.3.10 y pgvector 0.8.0, las mismas versiones que la imagen local de `docker/postgres`). Las migraciones las aplica la CI (job `migraciones`, solo en los push a `main` y después de las pruebas y de la imagen Docker), de modo que la base ya está migrada cuando Render despliega el código nuevo. Dos reglas se siguen de ahí: las migraciones ya aplicadas **no se editan nunca** (todo cambio de esquema va en una migración nueva) y toda migración **debe ser compatible con el código de la versión anterior**, que sigue atendiendo peticiones hasta que Render termina de desplegar (primero se amplía el esquema; lo que deja de usarse se retira en un despliegue posterior).
- **Peaje del plan gratuito**: el servicio se duerme tras 15 min sin tráfico y despierta con la primera petición (~1 min de arranque en frío).
