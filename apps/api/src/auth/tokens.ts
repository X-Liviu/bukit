import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { TokenPair } from "@bukit/core";

import { config } from "../config.js";
import { invalidToken } from "../http/errors.js";

// Emisión y verificación de los tokens de sesión (US-05).
// Firma simétrica HS256: la API es el único emisor y el único verificador, así
// que un par de claves asimétricas solo añadiría gestión sin aportar nada.
// El tipo va DENTRO del token («typ» propio, no el del encabezado JWT) para que
// un token de refresco no pueda usarse como si fuera de acceso: sin esa marca,
// el refresco —de vida larga— serviría para operar durante 30 días.
type TokenType = "access" | "refresh";

export interface TokenPayload {
  /** Identificador del usuario (subject estándar del JWT). */
  sub: string;
  typ: TokenType;
}

// jwtid (jti) aleatorio en cada token (US-06): desde que el refresco se guarda
// por su huella, dos tokens idénticos chocarían con la unicidad de token_hash.
// Sin él, dos inicios de sesión del mismo usuario en el mismo segundo (iat y
// exp tienen resolución de segundos) producirían exactamente el mismo token.
function sign(sub: string, typ: TokenType, expiresIn: number): string {
  return jwt.sign({ sub, typ }, config.jwt.secret, {
    algorithm: "HS256",
    expiresIn,
    issuer: config.jwt.issuer,
    jwtid: randomUUID(),
  });
}

/** Par de tokens de una sesión recién iniciada. */
export function issueTokenPair(userId: string): TokenPair {
  return {
    accessToken: sign(userId, "access", config.jwt.accessTtlSeconds),
    refreshToken: sign(userId, "refresh", config.jwt.refreshTtlSeconds),
    expiresIn: config.jwt.accessTtlSeconds,
  };
}

/**
 * Verifica un token y comprueba que es del tipo esperado. Cualquier fallo
 * (firma inválida, caducado, emisor ajeno, tipo equivocado) sale como el mismo
 * 401: los detalles se quedan dentro, porque distinguirlos hacia fuera ayuda a
 * quien prueba a ciegas.
 */
export function verifyToken(token: string, expected: TokenType): TokenPayload {
  // El secreto se lee FUERA del try: si falta o es inválido es un error de
  // configuración que debe explotar con su mensaje real, no disfrazarse del
  // 401 genérico (lo convertiría en un fallo permanente e indescifrable).
  const secret = config.jwt.secret;
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: config.jwt.issuer,
    });
  } catch {
    throw invalidToken();
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as Record<string, unknown>).sub !== "string" ||
    (decoded as Record<string, unknown>).typ !== expected
  ) {
    throw invalidToken();
  }

  const payload = decoded as Record<string, unknown>;
  return { sub: payload.sub as string, typ: expected };
}
