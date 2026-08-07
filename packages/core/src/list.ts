import { z } from "zod";

/**
 * Una lista agrupa metas; la FECHA LÍMITE vive en cada meta, no en la lista
 * (decisión del autor, 28-07-2026: la lista solo agrupa; recordatorios e IA
 * trabajan meta a meta).
 * El plan gratuito admite un máximo de 3 listas EN CURSO (decisión del autor,
 * 03-08-2026: completar una lista libera su hueco); regla de negocio a aplicar
 * en el back cuando llegue su épica (EP04).
 */
export const FREE_PLAN_MAX_ACTIVE_LISTS = 3;

/** Cada meta dentro de una lista, siempre con su fecha límite (RF-03). */
export const goalSchema = z.object({
  title: z.string().min(1).max(200),
  // La unión previa cierra el agujero de z.coerce.date() a secas: new Date(null)
  // y new Date(0) son el epoch de 1970 (fecha "válida"), y un formulario vacío
  // colaría una meta vencida hace décadas en vez de recibir un 400.
  deadline: z.union([z.string().min(1), z.date()]).pipe(z.coerce.date()),
  completed: z.boolean().default(false),
});
export type GoalInput = z.infer<typeof goalSchema>;

/** Crear/editar una lista: al menos una meta (RF-03), cada una con su plazo. */
export const createListSchema = z.object({
  title: z.string().min(1).max(120),
  goals: z.array(goalSchema).min(1).max(100),
});
export type CreateListInput = z.infer<typeof createListSchema>;
