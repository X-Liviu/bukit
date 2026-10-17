import type { Request, RequestHandler, Response } from "express";
import { rateLimit, type AugmentedRequest, type Options } from "express-rate-limit";
import { loginSchema } from "@bukit/core";

import { type AppError, tooManyLoginAttempts, tooManyRequests } from "../http/errors.js";
import { logger } from "../platform/logger.js";
import { clientIpKey } from "../http/client-ip.js";
import { config, type ClientIpHeader } from "../config.js";

// Doble capa de limitación de peticiones (US-07, RNF-03), el patrón de TrackBites
// corregido. Capa 1: por origen, protege la CPU (bcrypt) y frena el relleno de
// credenciales y el alta masiva. Capa 2: por cuenta y origen, frena la fuerza
// bruta contra una cuenta. Contadores en memoria, uno por cada createApp: con
// una sola instancia en Render es el contador global, y no se guarda ningún
// dato personal (RGPD). Alternativas descartadas: rate-limiter-flexible (su
// almacén de Prisma no es atómico y el de Postgres crea su tabla fuera de las
// migraciones) y Redis (aún no desplegado).

// El 429 lo traduce el manejador central, como cualquier otro error: ningún
// limitador responde por su cuenta. Sin cabeceras RateLimit-*: el cliente no
// necesita saber cuántos intentos le quedan, y un atacante tampoco. Retry-After
// sí, porque la biblioteca solo la envía junto a esas cabeceras.
function rejectWith(error: () => AppError, property: string): Options["handler"] {
  return (req, res, next) => {
    const resetTime = (req as AugmentedRequest)[property]?.resetTime;
    const seconds = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 1;
    res.setHeader("Retry-After", String(Math.max(seconds, 1)));
    next(error());
  };
}

const common = {
  standardHeaders: false,
  legacyHeaders: false,
  // Los avisos de configuración de la biblioteca, al registro de la API.
  logger: {
    error: (err: unknown, message?: string) =>
      logger.error({ err }, message ?? "express-rate-limit"),
    warn: (err: unknown, message?: string) => logger.warn({ err }, message ?? "express-rate-limit"),
  },
} satisfies Partial<Options>;

/**
 * Capa 1: cupo común de alta e inicio de sesión por origen, montado una vez
 * para las dos en su router intermedio (auth.routes.ts). Cuenta toda petición
 * con JSON válido, también los aciertos y los errores de validación, porque el
 * coste que protege se paga igual; lo que rechaza no llega ni a la base de
 * datos ni a bcrypt.
 */
export function createOriginLimiter(header: ClientIpHeader | undefined): RequestHandler {
  return rateLimit({
    ...common,
    ...config.rateLimit.byOrigin,
    keyGenerator: (req) => clientIpKey(req, header),
    handler: rejectWith(tooManyRequests, "rateLimit"),
  });
}

/** Email normalizado de un intento bien formado, o undefined si no lo es. */
function attemptEmail(req: Request): string | undefined {
  const parsed = loginSchema.safeParse(req.body);
  return parsed.success ? parsed.data.email : undefined;
}

/**
 * Capa 2: intentos de inicio de sesión por cuenta y origen.
 * - La clave une el email normalizado por el esquema compartido (mayúsculas y
 *   espacios no abren contadores nuevos) y el origen, así que nadie puede
 *   bloquear desde fuera la cuenta de otra persona. Defecto de TrackBites
 *   corregido: allí la clave era solo el email, en crudo.
 * - Cuenta cada intento bien formado ANTES de buscar al usuario y de bcrypt, de
 *   modo que una ráfaga en paralelo no se cuela; los mal formados (400) no
 *   gastan intentos.
 * - Durante el bloqueo ni la contraseña correcta entra (no hay oráculo), y un
 *   email inexistente se trata igual que uno real (no hay enumeración).
 * - Un acierto pone el contador a cero: se limitan los fallos seguidos.
 *   TrackBites contaba también los aciertos.
 */
export function createLoginLimiter(header: ClientIpHeader | undefined): RequestHandler {
  // Propiedad propia: en el inicio de sesión también pasa la capa 1, que deja
  // la suya en req.rateLimit.
  const property = "loginRateLimit";
  const limiter = rateLimit({
    ...common,
    ...config.rateLimit.byAccountAndOrigin,
    requestPropertyName: property,
    skip: (req) => attemptEmail(req) === undefined,
    keyGenerator: (req) => `${attemptEmail(req)}|${clientIpKey(req, header)}`,
    handler: rejectWith(tooManyLoginAttempts, property),
  });
  return (req: Request, res: Response, next) => {
    res.on("finish", () => {
      const key = (req as AugmentedRequest)[property]?.key;
      if (res.statusCode === 200 && key) void limiter.resetKey(key);
    });
    return limiter(req, res, next);
  };
}
