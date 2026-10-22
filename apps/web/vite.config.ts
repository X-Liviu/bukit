import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Una sola configuración para Vite y Vitest: Vitest lee este mismo archivo y
// toma su bloque `test`, así los dos comparten el plugin de React y cualquier
// ajuste de resolución que haga falta cuando entren los paquetes del workspace.
export default defineConfig({
  plugins: [react()],
  server: {
    // Puerto propio y estricto: el 5173, el de todos los proyectos Vite, lo
    // puede ocupar otro servidor de desarrollo del equipo, y Vite saltaría en
    // silencio a otro puerto mientras Playwright probaría la app equivocada
    // (ocurrió en la US-08). Si el 5180 está ocupado, falla y se ve.
    port: 5180,
    strictPort: true,
  },
  test: {
    // Las pruebas renderizan componentes y necesitan un DOM: lo simula jsdom,
    // el entorno de referencia de Testing Library.
    environment: "jsdom",
    // Antes de cada archivo: comparadores del DOM para expect y limpieza del
    // DOM entre pruebas (ver tests/setup.ts).
    setupFiles: ["./tests/setup.ts"],
  },
});
