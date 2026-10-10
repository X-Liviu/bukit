# apps/web

Cliente para navegador: **React + Vite + TypeScript**, con TanStack Query para el estado de
servidor y el feed infinito. El estado global (Redux Toolkit con Reselect u otra opción) está
**en consideración**: se decide al refinar EP03 (ver CLAUDE.md §1.4.2 y el cap. 6 de la memoria).

> Placeholder. Aún sin generar para no escribir a mano una config de Vite que
> quedaría desactualizada. Se scaffolda con la herramienta oficial al empezar EP03 (US-08):
>
> ```
> pnpm create vite@latest web -- --template react-ts
> ```
>
> Después: fijar `"name": "@bukit/web"`, añadir `"@bukit/core": "workspace:*"`,
> `"@bukit/api-client": "workspace:*"` y `"@bukit/ui-core": "workspace:*"`, y un tsconfig que
> extienda `../../tsconfig.base.json`.
