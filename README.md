# BUKIT

[![CI](https://github.com/X-Liviu/bukit/actions/workflows/ci.yml/badge.svg)](https://github.com/X-Liviu/bukit/actions/workflows/ci.yml)

La red social para cumplir tus objetivos. Monorepo del TFG (Grado en Ing. Informática, UPV/EHU).

## Estructura

```
bukit/
├── apps/
│   ├── web/            React + Vite + React Router + TS  (las cuatro pestañas, US-08)
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

**Stack:** pnpm · TypeScript estricto (paquetes sin compilar/JIT) · React + Vite + React Router +
TanStack Query (web) · Express 5 (API) · PostgreSQL + PostGIS + pgvector · Prisma · Docker (dev) /
Neon EU (prod).

## Requisitos

- **Node.js** ≥ 22. La versión exacta (hoy 24.21.0) se fija en el campo `volta` de `package.json`, que es la que usan la CI y la imagen Docker; [Volta](https://volta.sh) la aplica sola si está instalado y, si no, se instala esa misma versión con el instalador oficial.
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

| Comando                                               | Qué hace                                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm lint` / `pnpm format`                           | ESLint / Prettier en todo el repo                                                                                 |
| `pnpm typecheck`                                      | `tsc --noEmit` en cada paquete                                                                                    |
| `pnpm test` / `pnpm test:e2e`                         | Vitest en todos los paquetes (la API necesita el Postgres local levantado) / Playwright en `e2e` (arranca la web) |
| `pnpm web:dev`                                        | servidor de desarrollo de la web en http://localhost:5180 (puerto fijo y estricto)                                |
| `pnpm db:up` / `pnpm db:down`                         | arranca / para Postgres (Docker)                                                                                  |
| `pnpm db:reset`                                       | para Postgres y **borra** el volumen de datos                                                                     |
| `pnpm db:migrate` / `pnpm db:studio` / `pnpm db:seed` | Prisma en `apps/api`                                                                                              |

## Decisiones de arquitectura tomadas

1. Monorepo estándar (`apps/` + `packages/` + `e2e/`), gestor **pnpm**.
2. **TypeScript** estricto, config base en la raíz, paquetes consumidos **sin compilar**.
3. BD **PostgreSQL** + **PostGIS** (mapa) + **pgvector** (afinidad); **Prisma** como ORM
   (geo/vector en SQL crudo). Dev en **Docker**, producción en **Neon** (EU, RGPD).
4. Framework HTTP: **Express 5** estructurado a mano (descartado NestJS: el valor académico
   está en lo hecho a mano; ver cap. 6 de la memoria).
5. Integración y despliegue continuos: **GitHub Actions** (lint → typecheck → pruebas, imagen
   Docker en paralelo y migraciones de producción solo en `main`) y **Render** para la API
   (plan gratuito, Fráncfort, despliega solo con la CI en verde); detalle en `apps/api/README.md`.
6. API y web organizadas **por funcionalidad** (una carpeta por funcionalidad o pestaña, lo común
   aparte y sin depender de ellas); detalle en `apps/api/README.md` y `apps/web/README.md`.

Pendiente: scaffolding de `apps/mobile`.
