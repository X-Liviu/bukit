import express from "express";
import type { Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";

import { logger } from "./logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.js";

// La app Express, sin arrancar el servidor: se construye aparte del listen
// para poder testearla con Supertest sin abrir un puerto (igual que en
// TrackBites). Factoría en lugar de instancia única porque las pruebas
// necesitan inyectar rutas que fallan y estas deben registrarse ANTES de los
// manejadores finales (404 y errores), que siempre cierran la cadena.
export function createApp(extraRoutes?: (app: Express) => void): Express {
  const app = express();

  // No delatar el framework en cada respuesta: la cabecera X-Powered-By
  // regala el fingerprinting a un atacante sin aportar nada.
  app.disable("x-powered-by");

  // Traza cada petición con id propio, método, ruta, estado y duración.
  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());

  // Comprobación de vida del servicio.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Rutas de la API (US-04+).
  app.use(authRouter);

  extraRoutes?.(app);

  // Cierre de la cadena: 404 uniforme y traducción única de errores (US-02).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
