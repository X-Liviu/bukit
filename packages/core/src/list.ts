import { z } from "zod";

/**
 * Una lista es un conjunto de metas con un plazo (ver propuesta §3.3).
 * El plan gratuito permite hasta 3 listas (regla de negocio a aplicar en el back).
 */
export const FREE_PLAN_MAX_LISTS = 3;

/** Cada meta dentro de una lista. */
export const goalSchema = z.object({
  title: z.string().min(1).max(200),
  completed: z.boolean().default(false),
});
export type GoalInput = z.infer<typeof goalSchema>;

/** Crear/editar una lista. El plazo (deadline) es opcional. */
export const createListSchema = z.object({
  title: z.string().min(1).max(120),
  deadline: z.coerce.date().optional(),
  goals: z.array(goalSchema).max(100).default([]),
});
export type CreateListInput = z.infer<typeof createListSchema>;
