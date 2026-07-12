# BUKIT

La red social para cumplir tus objetivos. Monorepo del TFG (Grado en Ing. Informática, UPV/EHU).

## Estructura

```
bukit/
├── apps/
│   ├── web/            React + Vite + TS            (placeholder — create-vite)
│   ├── mobile/         React Native + Expo + TS     (placeholder — create-expo)
│   └── api/            Node + Prisma + TS
├── packages/
│   ├── core/           tipos + Zod        → universal (front + back)
│   ├── api-client/     cliente HTTP tipado → web + móvil   (stub)
│   └── ui-core/        lógica/estado sin DOM → web + móvil (stub)
├── e2e/                Playwright
├── docker/postgres/    imagen Postgres 16 + PostGIS + pgvector
└── docker-compose.yml  Postgres local (dev/tests/CI)
```

**Stack:** pnpm · TypeScript estricto (paquetes sin compilar/JIT) · PostgreSQL + PostGIS +
pgvector · Prisma · Docker (dev) / Neon EU (prod).

## Requisitos

- **Node.js** ≥ 22 (recomendado vía [Volta](https://volta.sh); la versión se fija en `package.json`).
- **pnpm** ≥ 9 (se activa con `corepack enable`, sin instalación aparte).
- **Docker Desktop** (con WSL2) para la base de datos local.

## Puesta en marcha

```bash
corepack enable                 # habilita pnpm con la versión fijada en el repo
pnpm install                    # instala todo el monorepo

cp apps/api/.env.example apps/api/.env

pnpm db:up                      # levanta Postgres (PostGIS + pgvector) en Docker
pnpm --filter @bukit/api prisma:generate
pnpm db:migrate                 # crea el esquema
pnpm db:seed                    # datos de ejemplo (opcional)
```

## Scripts (raíz)

| Comando | Qué hace |
|---|---|
| `pnpm lint` / `pnpm format` | ESLint / Prettier en todo el repo |
| `pnpm typecheck` | `tsc --noEmit` en cada paquete |
| `pnpm db:up` / `pnpm db:down` | arranca / para Postgres (Docker) |
| `pnpm db:reset` | para Postgres y **borra** el volumen de datos |
| `pnpm db:migrate` / `pnpm db:studio` / `pnpm db:seed` | Prisma en `apps/api` |

## Decisiones de arquitectura tomadas

1. Monorepo estándar (`apps/` + `packages/` + `e2e/`), gestor **pnpm**.
2. **TypeScript** estricto, config base en la raíz, paquetes consumidos **sin compilar**.
3. BD **PostgreSQL** + **PostGIS** (mapa) + **pgvector** (afinidad); **Prisma** como ORM
   (geo/vector en SQL crudo). Dev en **Docker**, producción en **Neon** (EU, RGPD).

Pendiente: framework HTTP del backend (Express bien estructurado vs. NestJS) y scaffolding
de `apps/web` y `apps/mobile`.
