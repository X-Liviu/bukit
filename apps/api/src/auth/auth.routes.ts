import { Router } from "express";
import { loginSchema, refreshTokenRequestSchema, registerUserSchema } from "@bukit/core";

import { invalidToken } from "../http/errors.js";
import { authenticate, getOwnUser, registerUser } from "./auth.service.js";
import { endSession, rotateSession, startSession } from "./sessions.js";
import { requireAuth } from "./require-auth.js";
import { createLoginLimiter, createOriginLimiter } from "./rate-limit.js";
import type { ClientIpHeader } from "../config.js";

// Rutas de autenticación. Cada una solo valida la entrada con el esquema
// compartido, llama a su servicio y responde; las reglas viven en los
// servicios. Rutas y servicios LANZAN y el manejador final traduce (RNF-03):
// ZodError → 400 con detalles; AppError → su estado.
//
// Factoría y no un router del módulo: los limitadores guardan contadores, y
// cada createApp debe estrenar los suyos (así cada prueba empieza de cero).
export function createAuthRouter(ipHeader: ClientIpHeader | undefined): Router {
  const router = Router();

  // --- Rutas de sesión: sin limitación de peticiones (sus tokens no se pueden
  // adivinar y se verifican antes de tocar la base). Van ANTES del grupo de
  // credenciales, que, colgado de /auth, recibe todo lo de /auth que no haya
  // atendido una ruta anterior: una ruta nueva de /auth que no deba limitarse
  // se declara aquí arriba.

  // Renovación de la sesión (US-06): par nuevo a cambio del token de refresco,
  // que queda anulado (rotación). Sin requireAuth: la credencial es el propio
  // token de refresco, y el de acceso puede haber caducado ya, que es justo
  // cuando el cliente necesita renovar.
  router.post("/auth/refresh", async (req, res) => {
    const { refreshToken } = refreshTokenRequestSchema.parse(req.body);
    res.json({ tokens: await rotateSession(refreshToken) });
  });

  // Cierre de sesión (US-06): anula la sesión del token presentado. 204 también
  // si ya estaba cerrada (idempotente).
  router.post("/auth/logout", async (req, res) => {
    const { refreshToken } = refreshTokenRequestSchema.parse(req.body);
    await endSession(refreshToken);
    res.status(204).end();
  });

  // Sesión actual: primera ruta privada del sistema y prueba viva de que el
  // guardia funciona de punta a punta (el 100 % de las rutas privadas exige
  // token válido, criterio de la US-05).
  router.get("/auth/me", requireAuth, async (req, res) => {
    // requireAuth deja siempre req.userId; sin él, la credencial no identifica a nadie.
    if (!req.userId) throw invalidToken();
    res.json({ user: await getOwnUser(req.userId) });
  });

  // --- Router intermedio de credenciales (US-07): el alta y el inicio de
  // sesión comparten la capa 1 de limitación, declarada una sola vez para el
  // grupo; la capa 2 va solo en el inicio de sesión.
  const credentials = Router();
  credentials.use(createOriginLimiter(ipHeader));

  // Alta de cuenta (US-04, RF-01).
  credentials.post("/register", async (req, res) => {
    const user = await registerUser(registerUserSchema.parse(req.body));
    res.status(201).json({ user });
  });

  // Inicio de sesión (US-05, RNF-03): credenciales correctas → par de tokens.
  // Desde la US-06 abre una sesión persistida: guarda la huella del token de
  // refresco para poder rotarlo y anularlo.
  credentials.post("/login", createLoginLimiter(ipHeader), async (req, res) => {
    const user = await authenticate(loginSchema.parse(req.body));
    res.json({ user, tokens: await startSession(user.id) });
  });

  router.use("/auth", credentials);
  return router;
}
