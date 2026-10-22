// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// Config plana (ESLint 9). Una sola config en la raíz para todo el monorepo.
// Prettier NO se ejecuta como regla de ESLint: formatea aparte (`pnpm format`).
// `eslint-config-prettier` va al final para desactivar reglas que chocan con Prettier.
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.expo/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/*.config.{js,cjs,mjs,ts}",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Scripts auxiliares de /coherencia (10-10-2026): CommonJS sobre Node, sin TypeScript,
  // para que el comando los ejecute con `node` sin compilar ni instalar nada.
  {
    files: ["docs/coherencia/scripts/**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    // Son CommonJS a propósito (el package.json de la raíz es "type": "module"): require() es lo correcto.
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Todo corre sobre Node (API, paquetes, e2e) salvo la web, que corre en el
  // navegador: cada una con sus globales, para que ESLint marque como no
  // definido lo que no existe en su entorno (process en la web, window en la API).
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["apps/web/**"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
  },
  // Reglas de los hooks de React (US-08): solo en la web, que es donde hay
  // componentes. El conjunto estable (`recommended`), no el experimental
  // (`recommended-latest`). `files` después del spread, para que mande el nuestro.
  {
    ...reactHooks.configs.flat.recommended,
    files: ["apps/web/**/*.{ts,tsx}"],
  },

  prettier,
);
