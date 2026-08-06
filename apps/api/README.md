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

## Variables de entorno

En local se cargan desde un `.env` en esta carpeta (vía `dotenv`); en Render se definen en el servicio (el Blueprint fija las estáticas).

| Variable   | Obligatoria | Descripción                                                                     |
| ---------- | ----------- | ------------------------------------------------------------------------------- |
| `PORT`     | No          | Puerto de escucha. Render la inyecta automáticamente; en local, 3001 de reserva. |
| `NODE_ENV` | No          | `production` en despliegue (logs JSON puros); `development` en local (pino-pretty). |

Ninguna variable es secreta todavía; cuando existan (base de datos, JWT…), se añadirán aquí y como secretos del servicio en Render, nunca al repositorio.

## Despliegue continuo (US-03)

- **Destino: Render** (región Frankfurt, plan gratuito). Decisión y alternativas descartadas (Railway, Fly.io) en el dev-journal del 06-08-2026 y en la memoria.
- **Infraestructura como código**: el servicio se define en el [`render.yaml`](../../render.yaml) de la raíz (Blueprint). Para crearlo la primera vez: Render → New → Blueprint → conectar este repositorio → Apply.
- **La imagen** se construye con el [`Dockerfile`](./Dockerfile) de esta carpeta, con la raíz del monorepo como contexto. El contenedor ejecuta la API con `tsx` porque los paquetes compartidos se consumen sin compilar (decisión del esqueleto, comentada en el propio Dockerfile).
- **Despliegue solo con la CI en verde**: `autoDeployTrigger: checksPass` — Render espera a los checks de GitHub Actions del commit y no despliega si alguno falla o si no hay checks.
- **Peaje del plan gratuito**: el servicio se duerme tras 15 min sin tráfico y despierta con la primera petición (~1 min de arranque en frío).
