import { z } from "zod";

/**
 * Dos niveles de usuario (ver propuesta §3.1):
 * - NORMAL: cualquier persona registrada. Menor peso en el feed.
 * - TOP: creador/influencer admitido. Vídeo ilimitado y alto peso en el feed.
 */
export const userTierSchema = z.enum(["NORMAL", "TOP"]);
export type UserTier = z.infer<typeof userTierSchema>;

/**
 * Email normalizado a minúsculas (dos grafías son la misma identidad; la
 * unicidad en BD es sobre el valor normalizado) y con el tope de longitud del
 * estándar SMTP (RFC 5321, 254): la columna de la BD lo respalda.
 */
export const emailSchema = z.string().trim().toLowerCase().max(254).email();

/**
 * Identidad pública del perfil (decisión del autor, 07-08-2026: cada cuenta
 * nace con ella porque el perfil es central en el producto). Se normaliza a
 * minúsculas antes de validar: «Liviu» y «liviu» son la misma identidad.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._]{3,30}$/, "De 3 a 30 caracteres: minúsculas, dígitos, punto o guion bajo");

/**
 * Registro de un nuevo usuario. Validación compartida front ↔ back.
 * El tope de 72 de la contraseña no es arbitrario: bcrypt solo usa los
 * primeros 72 BYTES y truncaría en silencio lo que sobre; con caracteres
 * multibyte (ñ, tildes, emoji) el corte llega antes de 72 caracteres, de ahí
 * la comprobación adicional en bytes.
 */
export const registerUserSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: z
    .string()
    .min(8)
    .max(72)
    .refine((p) => new TextEncoder().encode(p).length <= 72, {
      message: "La contraseña no puede superar los 72 bytes (límite de bcrypt)",
    }),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

/** Credenciales de inicio de sesión. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Usuario tal y como la API se lo devuelve a su PROPIETARIO — por eso incluye
 * su email — y nunca con el hash. La futura vista pública de perfil (sin
 * email) se definirá junto a su endpoint cuando exista: este contrato no debe
 * reutilizarse para serializar usuarios a terceros.
 */
export const ownUserSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  username: usernameSchema,
  tier: userTierSchema,
  createdAt: z.coerce.date(),
});
export type OwnUser = z.infer<typeof ownUserSchema>;
