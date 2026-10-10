import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { TokenPair } from "@bukit/core";

import { getPrisma } from "../prisma.js";
import { unauthorized } from "../errors.js";
import { issueTokenPair, verifyToken } from "./tokens.js";

// Sesiones con tokens de refresco persistidos (US-06): rotación en cada uso,
// cierre de sesión real y detección de reutilización. Una «familia» es un
// inicio de sesión con todas sus renovaciones; ante una reutilización se anula
// SOLO esa familia (decisión del autor del 10-10-2026), no todas las sesiones
// del usuario.

// Todos los fallos salen con el mismo 401 y el mismo mensaje, igual que en
// verifyToken: distinguir «caducado», «anulado» o «reutilizado» hacia fuera
// solo orienta a quien prueba tokens robados.
const MENSAJE = "Token inválido o caducado.";

/** Huella SHA-256 (hex, 64 caracteres) con la que se guarda y se busca el token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// La caducidad guardada es EXACTAMENTE la del JWT recién firmado: así una fila
// solo se purga cuando su token ya lo rechaza la propia verificación (exp), y
// borrarla no abre ningún hueco en la detección de reutilización.
function caducidad(refreshToken: string): Date {
  const { exp } = jwt.decode(refreshToken) as { exp: number };
  return new Date(exp * 1000);
}

async function anularFamilia(familyId: string, ahora: Date): Promise<void> {
  await getPrisma().refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: ahora },
  });
}

/**
 * Inicio de sesión: emite el par, guarda la huella del refresco en una familia
 * nueva y, de paso, borra los tokens caducados del propio usuario (opción A,
 * decisión del autor del 10-10-2026). Purga sin piezas nuevas y acotada a quien
 * entra; descartadas la purga global en cada inicio de sesión (escritura sobre
 * toda la tabla en la ruta más usada), una tarea programada (otro proceso con
 * el secreto de producción) y no borrar (acumular datos personales sin
 * finalidad choca con la minimización).
 */
export async function startSession(userId: string): Promise<TokenPair> {
  const tokens = issueTokenPair(userId);
  const prisma = getPrisma();
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }),
    prisma.refreshToken.create({
      data: {
        userId,
        familyId: randomUUID(),
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: caducidad(tokens.refreshToken),
      },
    }),
  ]);
  return tokens;
}

/**
 * Renovación con rotación: el token presentado se anula y se enlaza con el que
 * lo sustituye. Si llega uno ya renovado, alguien tiene una copia (el cliente
 * legítimo ya usa el nuevo): se anula toda su familia.
 */
export async function rotateSession(refreshToken: string): Promise<TokenPair> {
  // Firma, emisor, caducidad y tipo: un token de acceso no sirve para renovar.
  const { sub } = verifyToken(refreshToken, "refresh");
  const prisma = getPrisma();
  const actual = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  // Sin fila: token nunca emitido por esta base (o cuenta borrada, cuyas
  // sesiones se fueron en cascada). La comprobación del usuario es defensa en
  // profundidad: la huella ya identifica un único token.
  if (!actual || actual.userId !== sub) throw unauthorized(MENSAJE);

  const ahora = new Date();
  if (actual.revokedAt) {
    // Anulado por una rotación (tiene sucesor) = reutilización. Anulado por un
    // cierre de sesión (sin sucesor): su familia ya está cerrada.
    if (actual.replacedById) await anularFamilia(actual.familyId, ahora);
    throw unauthorized(MENSAJE);
  }
  if (actual.expiresAt <= ahora) throw unauthorized(MENSAJE);

  const tokens = issueTokenPair(actual.userId);
  const rotado = await prisma.$transaction(async (tx) => {
    // Anulación CONDICIONAL: si otra petición rotó este mismo token entre la
    // lectura y aquí, Postgres reevalúa el WHERE tras su commit y no actualiza
    // nada. Dos usos simultáneos del mismo token son indistinguibles de un
    // robo, así que se tratan como tal (se anula la familia, abajo).
    const { count } = await tx.refreshToken.updateMany({
      where: { id: actual.id, revokedAt: null },
      data: { revokedAt: ahora },
    });
    if (count !== 1) return false;
    const nuevo = await tx.refreshToken.create({
      data: {
        userId: actual.userId,
        familyId: actual.familyId,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: caducidad(tokens.refreshToken),
      },
    });
    await tx.refreshToken.update({ where: { id: actual.id }, data: { replacedById: nuevo.id } });
    return true;
  });
  if (!rotado) {
    await anularFamilia(actual.familyId, ahora);
    throw unauthorized(MENSAJE);
  }
  return tokens;
}

/**
 * Cierre de sesión: anula la familia del token presentado (la sesión entera,
 * no solo ese token). Es idempotente: cerrar una sesión ya cerrada no es un
 * error, y responder distinto delataría el estado del token.
 */
export async function endSession(refreshToken: string): Promise<void> {
  verifyToken(refreshToken, "refresh");
  const actual = await getPrisma().refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    select: { familyId: true },
  });
  if (actual) await anularFamilia(actual.familyId, new Date());
}
