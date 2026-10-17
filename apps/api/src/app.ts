import express from "express";
import type { Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";

import { logger } from "./logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { createLoginLimiter, createOriginLimiter } from "./middleware/rate-limit.js";
import { authRouter } from "./routes/auth.js";
import { config } from "./utils/config.js";

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
  // Retry-After expuesta: sin ella, el navegador no deja leerla al cliente web.
  app.use(cors({ exposedHeaders: ["Retry-After"] }));

  // Limitación de peticiones (US-07). Contadores nuevos en cada app, así que
  // ninguna prueba hereda los de otra. La cabecera se lee una vez: un valor no
  // admitido impide arrancar.
  const ipHeader = config.rateLimit.clientIpHeader;
  if (!ipHeader && config.nodeEnv === "production") {
    logger.warn(
      "Sin CLIENT_IP_HEADER: todos los clientes compartirán la IP del proxy y el mismo cupo.",
    );
  }
  // Capa 1, antes de parsear el cuerpo.
  app.post(["/auth/register", "/auth/login"], createOriginLimiter(ipHeader));
  app.use(express.json());

  // Comprobación de vida del servicio (sin límite: la usa Render).
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Capa 2, con el cuerpo ya parseado: necesita el email.
  app.post("/auth/login", createLoginLimiter(ipHeader));

  // Rutas de la API (US-04+).
  app.use(authRouter);

  extraRoutes?.(app);

  // Cierre de la cadena: 404 uniforme y traducción única de errores (US-02).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
