import { pino } from "pino";

import { config } from "../config.js";

// Registro de sucesos estructurado (US-02). JSON puro en producción (lo
// ingerirá la plataforma de despliegue), legible con pino-pretty solo en
// desarrollo, y apagado en las pruebas para no ensuciar la salida de Vitest.
// Alternativa descartada: winston (ver dev-journal del 27-07-2026).
const isDev = config.nodeEnv === "development";

// Redacción de secretos en TODO lo registrado, también lo que emite pino-http:
// las cabeceras con credenciales de cada petición y el cuerpo crudo que
// http-errors adjunta en err.body al fallar el parseo JSON (hallazgo de la
// revisión del 27-07: sin esto, los tokens JWT y hasta contraseñas de un login
// truncado acabarían en claro en los logs). Exportada aparte para poder
// probarla con un pino de prueba, porque el logger real va apagado en test.
// Desde la US-07 tampoco salen la IP del cliente ni las cabeceras de proxy que
// la llevan: son datos personales (RGPD) y el registro no los necesita; la
// limitación de peticiones los usa en memoria y no los guarda.
export const redactOptions = {
  paths: [
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
    "err.body",
    "req.remoteAddress",
    'req.headers["x-forwarded-for"]',
    'req.headers["cf-connecting-ip"]',
    'req.headers["true-client-ip"]',
    'req.headers["x-real-ip"]',
  ],
  censor: "[REDACTED]",
};

export const logger = pino({
  level: config.logLevel ?? (isDev ? "debug" : "info"),
  enabled: config.nodeEnv !== "test",
  redact: redactOptions,
  ...(isDev
    ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } } }
    : {}),
});
