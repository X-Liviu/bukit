import express from "express";
import type { Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";

import { logger } from "./platform/logger.js";
import { errorHandler, notFoundHandler } from "./http/error-handler.js";
import { createAuthRouter } from "./auth/auth.routes.js";
import { config } from "./config.js";

// La app Express, sin arrancar el servidor: se construye aparte del listen
// para poder testearla con Supertest sin abrir un puerto (igual que en
// TrackBites). Factoría en lugar de instancia única porque las pruebas
// necesitan inyectar rutas que fallan y estas deben registrarse ANTES de los
// manejadores finales (404 y errores), que siempre cierran la cadena; y porque
// cada app estrena sus contadores de limitación de peticiones (US-07).
export function createApp(extraRoutes?: (app: Express) => void): Express {
  const app = express();

  // No delatar el framework en cada respuesta: la cabecera X-Powered-By
  // regala el fingerprinting a un atacante sin aportar nada.
  app.disable("x-powered-by");

  // Traza cada petición con id propio, método, ruta, estado y duración.
  app.use(pinoHttp({ logger }));
  // Retry-After expuesta: sin ella, el navegador no deja leerla al cliente web.
  app.use(cors({ exposedHeaders: ["Retry-After"] }));
  // El cuerpo JSON se lee una vez para toda la API, como en TrackBites: solo
  // actúa si la petición declara application/json, con el mismo tope (100 kB)
  // y los mismos errores para toda ruta, presente o futura. Alternativa
  // descartada: leerlo ruta a ruta, que obliga a acordarse en cada una nueva.
  // El coste asumido es leer el cuerpo antes de que la limitación de
  // peticiones lo rechace, despreciable frente al bcrypt que esta protege.
  app.use(express.json());

  // Comprobación de vida del servicio (sin límite: la usa Render).
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // La cabecera de la IP real se lee una vez: un valor no admitido impide
  // arrancar, y su ausencia en producción se avisa (US-07).
  const ipHeader = config.rateLimit.clientIpHeader;
  if (!ipHeader && config.nodeEnv === "production") {
    logger.warn(
      "Sin CLIENT_IP_HEADER: todos los clientes compartirán la IP del proxy y el mismo cupo.",
    );
  }

  // Rutas de la API (US-04+), creadas por app: llevan sus limitadores dentro.
  app.use(createAuthRouter(ipHeader));

  extraRoutes?.(app);

  // Cierre de la cadena: 404 uniforme y traducción única de errores (US-02).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
