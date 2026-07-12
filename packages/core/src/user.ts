import { z } from "zod";

/**
 * Dos niveles de usuario (ver propuesta §3.1):
 * - NORMAL: cualquier persona registrada. Menor peso en el feed.
 * - TOP: creador/influencer admitido. Vídeo ilimitado y alto peso en el feed.
 */
export const userTierSchema = z.enum(["NORMAL", "TOP"]);
export type UserTier = z.infer<typeof userTierSchema>;

/** Registro de un nuevo usuario. Validación compartida front ↔ back. */
export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

/** Credenciales de inicio de sesión. */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
