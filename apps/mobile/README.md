# apps/mobile

App nativa iOS/Android: **React Native + Expo + TypeScript** (EAS build, OTA, push).
Versión **parcial y objetivo secundario** del TFG (pantallas núcleo contra la API real; ver
CLAUDE.md §1.4.2 y el cap. 3 de la memoria).

> Placeholder. Se scaffolda con la herramienta oficial cuando llegue su épica:
>
> ```
> pnpm create expo-app@latest mobile
> ```
>
> Después: fijar `"name": "@bukit/mobile"`, añadir `"@bukit/core": "workspace:*"`,
> `"@bukit/api-client": "workspace:*"` y `"@bukit/ui-core": "workspace:*"`.
>
> ⚠️ Si Metro se queja de los symlinks de pnpm, descomenta `node-linker=hoisted`
> en el `.npmrc` de la raíz.
