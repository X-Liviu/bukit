import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import type { ApiError } from "@bukit/core";

import { AppError } from "../errors.js";
import { logger } from "../logger.js";

// Traducción única de errores a HTTP (US-02, RNF-03). El detalle interno
// (stack, mensajes de librería) se registra en el logger pero nunca viaja
// al cliente: hacia fuera solo sale el contrato apiErrorSchema de core.

/** 404 uniforme para rutas inexistentes (el de serie de Express es HTML). */
export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiError = { error: { code: "NOT_FOUND", message: "Recurso no encontrado." } };
  res.status(404).json(body);
}

// Forma de los errores que lanza el propio framework (paquete http-errors,
// usado por body-parser al rechazar un cuerpo): estado 4xx y expose=true.
type ClientHttpError = { status: number; expose: boolean; message: string; type?: string };

function isClientHttpError(err: unknown): err is ClientHttpError {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  return typeof e.status === "number" && e.status >= 400 && e.status < 500 && e.expose === true;
}

// Tipos conocidos de body-parser → código estable y mensaje propio: nunca se
// reenvía el mensaje crudo de la librería (inglés y con detalle interno).
const FRAMEWORK_ERRORS: Record<string, ApiError["error"]> = {
  "entity.parse.failed": {
    code: "BAD_REQUEST",
    message: "El cuerpo de la petición no es JSON válido.",
  },
  "entity.too.large": {
    code: "PAYLOAD_TOO_LARGE",
    message: "El cuerpo de la petición supera el tamaño máximo.",
  },
  "charset.unsupported": {
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "El juego de caracteres de la petición no está soportado.",
  },
  "encoding.unsupported": {
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "La codificación de la petición no está soportada.",
  },
};

/**
 * Manejador de errores final de la cadena. Express lo reconoce como tal por
 * su firma de 4 parámetros; en Express 5 los errores de handlers async llegan
 * aquí solos, sin necesidad de envoltorios como express-async-errors.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  // Si ya se empezó a responder, delega en el manejador de serie de Express
  // (cierra la conexión): una respuesta a medias no puede reescribirse.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ code: err.code, status: err.status }, err.message);
    res.status(err.status).json(err.toBody());
    return;
  }

  // Un ZodError que escapa de una ruta es una validación de entrada fallida:
  // 400 con el detalle campo a campo (path + motivo), que sí es seguro.
  if (err instanceof ZodError) {
    const body: ApiError = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Los datos recibidos no son válidos.",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
    logger.warn({ details: body.error.details }, "validación de entrada fallida");
    res.status(400).json(body);
    return;
  }

  // Errores del framework (body-parser: JSON malformado, cuerpo demasiado
  // grande, charset no soportado): culpa del cliente, así que se respeta su
  // estado (400/413/415) y se registra a warn SIN el objeto err completo —
  // el SyntaxError del parser arrastra el cuerpo crudo en err.body, que puede
  // contener credenciales (el logger además lo redacta como red de seguridad).
  if (isClientHttpError(err)) {
    const translated = (err.type && FRAMEWORK_ERRORS[err.type]) || {
      code: "REQUEST_ERROR",
      message: "La petición no es válida.",
    };
    logger.warn({ type: err.type, status: err.status }, err.message);
    const body: ApiError = { error: translated };
    res.status(err.status).json(body);
    return;
  }

  // Resto: error no controlado. Stack completo al registro, genérico al cliente.
  logger.error({ err }, "error no controlado");
  const body: ApiError = {
    error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." },
  };
  res.status(500).json(body);
}
