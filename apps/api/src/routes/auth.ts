import { Router } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { publicUserSchema, registerUserSchema } from "@bukit/core";

import { getPrisma } from "../prisma.js";
import { conflict } from "../errors.js";

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
    // El contrato compartido es la ÚNICA fuente de la forma pública: la
    // respuesta se parsea con él, de modo que el hash (o cualquier campo futuro
    // sin finalidad pública) no puede salir por accidente aunque el select
    // cambiara.
    res.status(201).json({ user: publicUserSchema.parse(user) });
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
