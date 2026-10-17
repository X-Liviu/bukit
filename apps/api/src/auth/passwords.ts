import bcrypt from "bcryptjs";

import { config } from "../config.js";

// Contraseñas (US-04 y US-05): solo se guarda su hash bcrypt, con el coste de
// config.bcryptRounds. Un único módulo para la API y el seed, de modo que toda
// contraseña se guarda con la misma regla.

/** Hash bcrypt de una contraseña con el coste configurado. */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcryptRounds);
}

// Hash de referencia para las comparaciones de emails inexistentes: se genera
// UNA vez con el coste vigente (no un literal: la revisión adversarial cazó
// que un hash de longitud incorrecta hace que bcryptjs devuelva false al
// instante, y la igualación de tiempos no igualaba nada — 0 ms frente a
// ~250 ms delataban qué emails existen).
let referenceHash: string | undefined;
async function getReferenceHash(): Promise<string> {
  referenceHash ??= await bcrypt.hash("contraseña-de-referencia", config.bcryptRounds);
  return referenceHash;
}

/**
 * Comprueba una contraseña contra su hash. Sin hash (el email no existe)
 * compara igualmente contra el de referencia y devuelve false: las dos vías
 * pagan una comparación bcrypt completa, para que la latencia no delate qué
 * emails están dados de alta.
 */
export async function verifyPassword(password: string, hash: string | undefined): Promise<boolean> {
  const matches = await bcrypt.compare(password, hash ?? (await getReferenceHash()));
  return hash !== undefined && matches;
}
