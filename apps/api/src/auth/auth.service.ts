import { Prisma } from "@prisma/client";
import { ownUserSchema, type LoginInput, type OwnUser, type RegisterUserInput } from "@bukit/core";

import { getPrisma } from "../platform/prisma.js";
import { conflict, invalidToken, unauthorized } from "../http/errors.js";
import { hashPassword, verifyPassword } from "./passwords.js";

// Reglas de las cuentas (US-04 y US-05), fuera de las rutas: las rutas solo
// validan, llaman y responden, y estas reglas se pueden usar sin pasar por HTTP.
// Todas devuelven la vista del PROPIETARIO validada con el contrato compartido:
// así el hash (o cualquier campo futuro sin finalidad en la respuesta) no puede
// salir por accidente aunque cambie la consulta.

/**
 * Alta de cuenta. De la contraseña solo se guarda su hash. Unicidad violada →
 * 409 explícito, con el mensaje según el campo en conflicto para que el
 * cliente pueda corregirlo.
 */
export async function registerUser(input: RegisterUserInput): Promise<OwnUser> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await getPrisma().user.create({
      data: { email: input.email, username: input.username, passwordHash },
      select: { id: true, email: true, username: true, tier: true, createdAt: true },
    });
    return ownUserSchema.parse(user);
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
}

/**
 * Comprobación de credenciales del inicio de sesión. Un email inexistente y una
 * contraseña incorrecta dan EXACTAMENTE el mismo error, y verifyPassword paga
 * en ambas vías una comparación bcrypt completa: ni el cuerpo ni la latencia
 * delatan qué emails están dados de alta (enumeración de usuarios).
 */
export async function authenticate(input: LoginInput): Promise<OwnUser> {
  const user = await getPrisma().user.findUnique({ where: { email: input.email } });
  const passwordMatches = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !passwordMatches) throw unauthorized("Email o contraseña incorrectos.");
  return ownUserSchema.parse(user);
}

/**
 * La cuenta del usuario autenticado. Si el token es válido pero su usuario ya
 * no existe (cuenta borrada entre la emisión y el uso), no es un 404 del
 * recurso: es una credencial que ya no identifica a nadie.
 */
export async function getOwnUser(userId: string): Promise<OwnUser> {
  const user = await getPrisma().user.findUnique({ where: { id: userId } });
  if (!user) throw invalidToken();
  return ownUserSchema.parse(user);
}
