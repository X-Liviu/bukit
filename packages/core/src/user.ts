import { z } from "zod";

/**
 * Dos niveles de usuario (ver propuesta §3.1):
 * - NORMAL: cualquier persona registrada. Menor peso en el feed.
 * - TOP: creador/influencer admitido. Vídeo ilimitado y alto peso en el feed.
 */
export const userTierSchema = z.enum(["NORMAL", "TOP"]);
export type UserTier = z.infer<typeof userTierSchema>;

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

/** Registro de un nuevo usuario. Validación compartida front ↔ back. */
export const registerUserSchema = z.object({
  // El email también se normaliza: la unicidad en BD es sobre el valor normalizado.
  email: z.string().trim().toLowerCase().email(),
  username: usernameSchema,
  password: z.string().min(8).max(128),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

/** Credenciales de inicio de sesión. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Usuario tal y como lo devuelve la API a su propietario: el contrato nunca
 * incluye el hash de la contraseña ni datos sin finalidad en la respuesta.
 */
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: usernameSchema,
  tier: userTierSchema,
  createdAt: z.coerce.date(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
