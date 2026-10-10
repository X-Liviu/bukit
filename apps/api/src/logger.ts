import { pino } from "pino";

import { config } from "./utils/config.js";

// Registro de sucesos estructurado (US-02). JSON puro en producción (lo
// ingerirá la plataforma de despliegue), legible con pino-pretty solo en
// desarrollo, y apagado en las pruebas para no ensuciar la salida de Vitest.
// Alternativa descartada: winston (ver dev-journal del 27-07-2026).
const isDev = config.nodeEnv === "development";

// Redacción de secretos en TODO lo registrado, también lo que emite pino-http:
// las cabeceras con credenciales de cada petición y el cuerpo crudo que
// http-errors adjunta en err.body al fallar el parseo JSON (hallazgo de la
// revisión del 27-07: sin esto, el futuro token JWT y hasta contraseñas de un
// login truncado acabarían en claro en los logs). Exportada aparte para poder
// probarla con un pino de prueba, porque el logger real va apagado en test.
export const redactOptions = {
  paths: [
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
    "err.body",
  ],
  censor: "[REDACTED]",
};

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  enabled: config.nodeEnv !== "test",
  redact: redactOptions,
  ...(isDev
    ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } } }
    : {}),
});
