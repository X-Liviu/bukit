import type { ApiError } from "@bukit/core";

type ErrorDetails = ApiError["error"]["details"];

/**
 * Error de negocio con estado HTTP y código estable. Las rutas LANZAN
 * (AppError o ZodError) y solo el middleware final traduce a respuesta:
 * ninguna ruta responde errores por su cuenta (RNF-03).
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ErrorDetails;

  constructor(status: number, code: string, message: string, details?: ErrorDetails) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Cuerpo JSON con el contrato compartido de core. */
  toBody(): ApiError {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

// Fábricas de los errores habituales, para que las rutas lean como prosa.
export const badRequest = (message: string, details?: ErrorDetails): AppError =>
  new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "No autenticado."): AppError =>
  new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Sin permisos para esta operación."): AppError =>
  new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Recurso no encontrado."): AppError =>
  new AppError(404, "NOT_FOUND", message);
