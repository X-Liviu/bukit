import type { NextFunction, Request, Response } from "express";

import { verifyToken } from "./tokens.js";
import { unauthorized } from "../http/errors.js";

// Guardia de las rutas privadas (US-05, RNF-03): sin token de acceso válido no
// se entra. Se aplica ruta a ruta —no de forma global— para que abrir una ruta
// al público sea siempre una decisión explícita y visible en su declaración,
// en lugar de un olvido en una lista de excepciones.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Usuario autenticado; solo existe tras pasar por requireAuth. */
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.get("authorization");
  // Esquema Bearer del estándar HTTP; la comparación del esquema es
  // insensible a mayúsculas, como exige la especificación.
  const [scheme, token] = header?.split(" ") ?? [];
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    next(unauthorized("Falta el token de acceso."));
    return;
  }

  try {
    req.userId = verifyToken(token, "access").sub;
    next();
  } catch (err) {
    next(err);
  }
}
