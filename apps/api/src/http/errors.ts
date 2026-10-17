import type { ApiError } from "@bukit/core";

type ErrorDetails = ApiError["error"]["details"];

/**
 * Error de negocio con estado HTTP y código estable. Las rutas y los servicios
 * LANZAN (AppError o ZodError) y solo el middleware final traduce a respuesta:
 * nadie responde errores por su cuenta (RNF-03).
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

// Fábricas de los errores habituales, para que rutas y servicios lean como prosa.
export const badRequest = (message: string, details?: ErrorDetails): AppError =>
  new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "No autenticado."): AppError =>
  new AppError(401, "UNAUTHORIZED", message);
// Todo rechazo de un token, de acceso o de refresco, sale con este mismo error:
// distinguir «caducado», «anulado», «reutilizado» o «de una cuenta borrada»
// solo orientaría a quien prueba tokens robados (US-06). Una sola fábrica lo
// garantiza por construcción.
export const invalidToken = (): AppError => unauthorized("Token inválido o caducado.");
export const forbidden = (message = "Sin permisos para esta operación."): AppError =>
  new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Recurso no encontrado."): AppError =>
  new AppError(404, "NOT_FOUND", message);
export const conflict = (message: string, details?: ErrorDetails): AppError =>
  new AppError(409, "CONFLICT", message, details);
// Las dos capas de la US-07 responden con códigos distintos para que el cliente
// explique bien la espera; ninguno revela si la cuenta existe.
export const tooManyRequests = (): AppError =>
  new AppError(
    429,
    "TOO_MANY_REQUESTS",
    "Demasiadas peticiones desde esta conexión. Vuelve a intentarlo más tarde.",
  );
export const tooManyLoginAttempts = (): AppError =>
  new AppError(
    429,
    "TOO_MANY_LOGIN_ATTEMPTS",
    "Demasiados intentos de inicio de sesión. Vuelve a intentarlo más tarde.",
  );
