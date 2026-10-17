import { Router } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import {
  loginSchema,
  ownUserSchema,
  refreshTokenRequestSchema,
  registerUserSchema,
} from "@bukit/core";

import { getPrisma } from "../prisma.js";
import { conflict, unauthorized } from "../errors.js";
import { endSession, rotateSession, startSession } from "../utils/sessions.js";
import { requireAuth } from "../middleware/require-auth.js";

// Coste del hash bcrypt: 12 rondas por defecto (producción), configurable por
// entorno. Con bcryptjs (JS puro) 12 rondas cuestan en torno a 1 s de CPU en el
// único hilo de Node — asumible para altas esporádicas—; las pruebas usan un
// coste bajo para no pagar segundos de CPU por caso.
function bcryptRounds(): number {
  return Number(process.env.BCRYPT_ROUNDS ?? 12);
}

export const authRouter = Router();

// Alta de cuenta (US-04, RF-01). La ruta LANZA y el middleware final traduce
// (RNF-03): ZodError → 400 con detalles; unicidad violada → 409 explícito, con
// el mensaje según el campo en conflicto para que el cliente pueda corregirlo.
authRouter.post("/auth/register", async (req, res) => {
  const input = registerUserSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, bcryptRounds());
  try {
    const user = await getPrisma().user.create({
      data: { email: input.email, username: input.username, passwordHash },
      select: { id: true, email: true, username: true, tier: true, createdAt: true },
    });
    // El contrato compartido de la vista del PROPIETARIO es la única fuente de
    // la forma de respuesta: parsearla con él garantiza que el hash (o
    // cualquier campo futuro sin finalidad en la respuesta) no puede salir por
    // accidente aunque el select cambiara.
    res.status(201).json({ user: ownUserSchema.parse(user) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // meta.target puede llegar como array de campos o como string según el
      // camino del motor; comparación EXACTA por elemento (nada de includes
      // sobre texto concatenado) y mensaje neutro si el campo no se reconoce.
      const target = err.meta?.target;
      const fields = Array.isArray(target)
        ? target.map(String)
        : typeof target === "string"
          ? [target]
          : [];
      throw conflict(
        fields.includes("username")
          ? "Ese nombre de usuario ya está en uso."
          : fields.includes("email")
            ? "Ese email ya está registrado."
            : "Ese email o nombre de usuario ya está en uso.",
      );
    }
    throw err;
  }
});

// Hash de referencia para las comparaciones de emails inexistentes: se genera
// UNA vez con el coste vigente (no un literal: la revisión adversarial cazó
// que un hash de longitud incorrecta hace que bcryptjs devuelva false al
// instante, y la igualación de tiempos no igualaba nada — 0 ms frente a
// ~250 ms delataban qué emails existen).
let referenceHash: string | undefined;
async function getReferenceHash(): Promise<string> {
  referenceHash ??= await bcrypt.hash("contraseña-de-referencia", bcryptRounds());
  return referenceHash;
}

// Inicio de sesión (US-05, RNF-03): credenciales correctas → par de tokens.
// La fuerza bruta la frenan las dos capas de limitación de la US-07, montadas
// en createApp antes de esta ruta (middleware/rate-limit.ts).
authRouter.post("/auth/login", async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await getPrisma().user.findUnique({ where: { email: input.email } });

  // Un email inexistente y una contraseña incorrecta devuelven EXACTAMENTE la
  // misma respuesta, y ambas vías pagan una comparación bcrypt completa: ni el
  // cuerpo ni la latencia deben delatar qué emails están dados de alta
  // (enumeración de usuarios).
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? (await getReferenceHash()),
  );
  if (!user || !passwordMatches) {
    throw unauthorized("Email o contraseña incorrectos.");
  }

  res.json({
    user: ownUserSchema.parse(user),
    // Desde la US-06 el inicio de sesión abre una sesión persistida: guarda
    // la huella del token de refresco para poder rotarlo y anularlo.
    tokens: await startSession(user.id),
  });
});

// Renovación de la sesión (US-06): par nuevo a cambio del token de refresco,
// que queda anulado (rotación). Sin requireAuth: la credencial es el propio
// token de refresco, y el de acceso puede haber caducado ya, que es justo
// cuando el cliente necesita renovar.
authRouter.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = refreshTokenRequestSchema.parse(req.body);
  res.json({ tokens: await rotateSession(refreshToken) });
});

// Cierre de sesión (US-06): anula la sesión del token presentado. 204 también
// si ya estaba cerrada (idempotente).
authRouter.post("/auth/logout", async (req, res) => {
  const { refreshToken } = refreshTokenRequestSchema.parse(req.body);
  await endSession(refreshToken);
  res.status(204).end();
});

// Sesión actual: primera ruta privada del sistema y prueba viva de que el
// guardia funciona de punta a punta (el 100 % de las rutas privadas exige
// token válido, criterio de la US-05).
authRouter.get("/auth/me", requireAuth, async (req, res) => {
  const user = await getPrisma().user.findUnique({ where: { id: req.userId } });
  // El token es válido pero su usuario ya no existe (cuenta borrada entre la
  // emisión y el uso): no es un 404 del recurso, es una credencial que ya no
  // identifica a nadie.
  if (!user) throw unauthorized("Token inválido o caducado.");
  res.json({ user: ownUserSchema.parse(user) });
});
