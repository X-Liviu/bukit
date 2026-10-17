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

| Variable           | Obligatoria                   | Secreta | Descripción                                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ----------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`     | Sí (para las rutas con datos) | Sí      | Cadena de conexión de PostgreSQL. En local, el Postgres de Docker (ver `.env.example`). En producción, Neon: el valor vive fuera del repositorio: en el panel de Render (`sync: false` en `render.yaml`), en el secreto `DATABASE_URL_PRODUCTION` de GitHub, que usa el job de migraciones, y en el `apps/api/.env.production` local (ignorado por git).         |
| `JWT_SECRET`       | En producción                 | Sí      | Secreto de firma de los tokens (mínimo 32 caracteres; uno más corto es un error en cualquier entorno). En local hay uno de desarrollo; en Render lo genera el Blueprint (`generateValue`).                                                                                                                                                                       |
| `PORT`             | No                            | No      | Puerto de escucha. Render la inyecta automáticamente; en local, 3001 de reserva.                                                                                                                                                                                                                                                                                 |
| `NODE_ENV`         | No                            | No      | `production` en despliegue (logs JSON puros); `development` en local (pino-pretty).                                                                                                                                                                                                                                                                              |
| `LOG_LEVEL`        | No                            | No      | Nivel del registro de sucesos de pino; por defecto `debug` en desarrollo e `info` en producción.                                                                                                                                                                                                                                                                 |
| `BCRYPT_ROUNDS`    | No                            | No      | Coste del hash de contraseñas; por defecto 12. Las pruebas lo bajan a 4 para ir rápido.                                                                                                                                                                                                                                                                          |
| `CLIENT_IP_HEADER` | En producción                 | No      | Cabecera de confianza con la IP real del cliente para la limitación de peticiones: `cf-connecting-ip` en Render (la fija el Blueprint). En local y en la CI no se define y cuenta la IP del socket. Cualquier otro valor impide arrancar. Sin ella en producción, todos los clientes compartirían la IP del proxy y el mismo cupo (la API lo avisa al arrancar). |

Los secretos nunca entran en el repositorio: el `.env` y sus variantes (`.env.*`, salvo `.env.example`) están en `.gitignore` y en `.dockerignore`.

## Limitación de peticiones (US-07)

Doble capa, con `express-rate-limit` y los contadores en memoria (`src/middleware/rate-limit.ts`; umbrales en `src/utils/config.ts`):

- **Capa 1, por IP**: `POST /auth/register` y `POST /auth/login` comparten 20 peticiones cada 15 min. Cuenta todas y corta antes de parsear el cuerpo, de consultar la base y de bcrypt. `429 TOO_MANY_REQUESTS`.
- **Capa 2, por email normalizado e IP**: `POST /auth/login`, 5 intentos bien formados cada 15 min, contados antes de bcrypt; un acierto pone el contador a cero. Durante el bloqueo ni la contraseña correcta entra, y un email inexistente se trata igual que uno real. `429 TOO_MANY_LOGIN_ATTEMPTS`.
- Las dos responden con el contrato de errores y `Retry-After` (expuesta por CORS). `/health`, `/auth/refresh`, `/auth/logout` y `/auth/me` no se limitan.
- **IP real**: de `CF-Connecting-IP`, que Cloudflare sobrescribe en cada petición a Render, solo con `CLIENT_IP_HEADER`. Nunca de `X-Forwarded-For`: su parte izquierda la escribe el cliente. Las IPv6 cuentan por su red /56.
- **Datos personales**: la IP y el email solo viven en memoria, como mucho una ventana; el registro de sucesos oculta la IP y las cabeceras de proxy.
- **Comprobación tras desplegar**: seis inicios de sesión fallidos con un email de `example.com` dan cinco 401 y un 429 `TOO_MANY_LOGIN_ATTEMPTS`; después, desde otra red, ese email sigue respondiendo 401 (no comparte cupo con la primera).
- **Límites**: con una sola instancia, la memoria es el contador global; cada despliegue o reinicio lo pone a cero. Con varias instancias haría falta un almacén compartido (Redis, cuando llegue con BullMQ).

## Despliegue continuo (US-03)

- **Destino: Render** (región Fráncfort, plan gratuito). Decisión y alternativas descartadas (Railway, Fly.io) en el dev-journal del 06-08-2026 y en la memoria.
- **URL pública**: `https://bukit-api-07ph.onrender.com`; `/health` comprueba que el despliegue responde.
- **Infraestructura como código**: el servicio se define en el [`render.yaml`](../../render.yaml) de la raíz (Blueprint). Para crearlo la primera vez: Render → New → Blueprint → conectar este repositorio → Apply.
- **La imagen** se construye con el [`Dockerfile`](./Dockerfile) de esta carpeta, con la raíz del monorepo como contexto. El contenedor ejecuta la API con `tsx` porque los paquetes compartidos se consumen sin compilar (decisión del esqueleto, comentada en el propio Dockerfile).
- **Despliegue solo con la CI en verde**: `autoDeployTrigger: checksPass` — Render espera a los checks de GitHub Actions del commit y no despliega si alguno falla o si no hay checks.
- **Base de datos de producción: Neon** (región Fráncfort, PostgreSQL 16.15 con PostGIS 3.3.10 y pgvector 0.8.0, las mismas versiones que la imagen local de `docker/postgres`). Las migraciones las aplica la CI (job `migrate`, solo en los push a `main` y después de las pruebas y de la imagen Docker), de modo que la base ya está migrada cuando Render despliega el código nuevo. Dos reglas se siguen de ahí: las migraciones ya aplicadas **no se editan nunca** (todo cambio de esquema va en una migración nueva) y toda migración **debe ser compatible con el código de la versión anterior**, que sigue atendiendo peticiones hasta que Render termina de desplegar (primero se amplía el esquema; lo que deja de usarse se retira en un despliegue posterior).
- **Conexión a Neon**: siempre la URL **directa, sin pooler** (el pooler en modo transacción rompe los bloqueos de `prisma migrate`). Vive en la variable `DATABASE_URL` del panel de Render y en el secreto de GitHub `DATABASE_URL_PRODUCTION`, nunca en el repositorio; para comprobaciones locales, en `apps/api/.env.production` (ignorado por git), cuyo valor no se imprime nunca.
- **Peaje del plan gratuito**: el servicio se duerme tras 15 min sin tráfico y despierta con la primera petición (~1 min de arranque en frío).
