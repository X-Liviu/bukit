// Se ejecuta antes de cada archivo de prueba (setupFiles de vite.config.ts).
// Comparadores del DOM para expect (toBeInTheDocument, toHaveAttribute…).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library solo desmonta sola lo renderizado cuando afterEach es
// global, y Vitest no expone globales aquí: se registra a mano, para que una
// prueba no vea el DOM de la anterior.
afterEach(cleanup);
