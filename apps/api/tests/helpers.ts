import type { Express } from "express";
import request from "supertest";

// Lo que comparten las suites de autenticación. Cada suite borra las cuentas
// en su beforeEach, así que todas pueden usar la misma cuenta de ejemplo.

/** Cuenta de ejemplo de las pruebas (dominio reservado, regla del proyecto). */
export const account = {
  email: "persona@example.com",
  username: "persona.ejemplo",
  password: "contraseña-larga",
};

/**
 * Alta de la cuenta de ejemplo por la propia API. Con ip, la petición llega
 * como de ese cliente (CF-Connecting-IP), para no gastar el cupo de otro.
 */
export async function registerAccount(app: Express, ip?: string): Promise<void> {
  const req = request(app).post("/auth/register");
  if (ip) req.set("CF-Connecting-IP", ip);
  await req.send(account).expect(201);
}
