// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
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
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  prettier,
);
