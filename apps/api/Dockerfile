# syntax=docker/dockerfile:1
# =========================================================================
# Imagen de la API de BUKIT (US-03: despliegue del esqueleto).
#
# El contexto de build es la RAÍZ del monorepo (ver render.yaml:
# dockerContext .) porque la API consume @bukit/core SIN COMPILAR desde
# packages/core/src. Por esa misma razón el contenedor ejecuta la API con
# tsx (runtime de TypeScript) en lugar de `node dist/`: compilar solo
# apps/api dejaría los imports de @bukit/core apuntando a archivos .ts que
# Node no puede cargar. Decisión del esqueleto, revisable si algún día los
# paquetes compartidos pasan a compilarse.
#
# Node fijado a la versión de Volta (24.18.0) y pnpm a la del campo
# packageManager vía corepack: las mismas versiones en desarrollo, CI e
# imagen (reproducibilidad, regla del proyecto).
# =========================================================================
FROM node:24.18.0-alpine AS deps
RUN corepack enable
WORKDIR /app
# Solo los manifiestos: esta capa queda cacheada mientras no cambien las
# dependencias. pnpm necesita el manifiesto de TODOS los proyectos del
# workspace para validar el lockfile congelado, aunque instale solo
# producción (web y mobile no cuentan: aún no tienen package.json).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/api-client/package.json packages/api-client/
COPY packages/ui-core/package.json packages/ui-core/
COPY e2e/package.json e2e/
RUN pnpm install --frozen-lockfile --prod

FROM node:24.18.0-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app ./
# Código fuente: la API y el único paquete que consume en runtime.
COPY tsconfig.base.json ./
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/src apps/api/src
COPY packages/core/src packages/core/src
# Usuario sin privilegios de la imagen oficial de Node.
USER node
WORKDIR /app/apps/api
# Render inyecta PORT (config.ts lo lee, con 3001 de reserva en local).
EXPOSE 3001
CMD ["./node_modules/.bin/tsx", "src/index.ts"]
