import { z } from "zod";

/**
 * Contrato único de error de la API (RNF-03): toda respuesta de error —404,
 * negocio, validación o fallo interno— tiene exactamente esta forma.
 * Vive en core para que la API lo produzca y el cliente tipado lo consuma
 * sin duplicar el esquema (misma regla que la validación de usuario).
 */
export const apiErrorSchema = z.object({
  error: z.object({
    // Código estable en MAYÚSCULAS pensado para programar contra él
    // (p. ej. "VALIDATION_ERROR"), independiente del mensaje humano.
    code: z.string().min(1),
    message: z.string().min(1),
    // Detalle opcional y seguro (nunca trazas internas): hoy lo usan los
    // errores de validación para enumerar cada campo y su motivo.
    details: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
        }),
      )
      .optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
