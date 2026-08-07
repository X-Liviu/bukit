import { describe, expect, it } from "vitest";

import { loginSchema, publicUserSchema, registerUserSchema, userTierSchema } from "../src/user";

// Primer test del monorepo. Cubre los esquemas compartidos de usuario por un
// motivo doble: son la validación única front ↔ back (RNF-01) y dan contenido
// real a la etapa de pruebas de la CI (US-01), que sin ningún test pasaría en
// vacío sin demostrar nada.
describe("registerUserSchema", () => {
  it("acepta un registro válido", () => {
    const result = registerUserSchema.safeParse({
      email: "persona@ejemplo.com",
      username: "persona.ejemplo",
      password: "contraseña-larga",
    });
    expect(result.success).toBe(true);
  });

  it("normaliza email y username a minúsculas (misma identidad, misma unicidad)", () => {
    const result = registerUserSchema.parse({
      email: "  Persona@Ejemplo.COM ",
      username: "Persona.Ejemplo",
      password: "contraseña-larga",
    });
    expect(result.email).toBe("persona@ejemplo.com");
    expect(result.username).toBe("persona.ejemplo");
  });

  it("rechaza un email mal formado", () => {
    const result = registerUserSchema.safeParse({
      email: "no-es-un-email",
      username: "persona",
      password: "contraseña-larga",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza contraseñas de menos de 8 caracteres", () => {
    const result = registerUserSchema.safeParse({
      email: "persona@ejemplo.com",
      username: "persona",
      password: "corta",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza usernames fuera del alfabeto o de la longitud permitidos", () => {
    for (const username of ["ab", "con espacios", "conÑ", "a".repeat(31), "email@no"]) {
      expect(registerUserSchema.safeParse({
        email: "persona@ejemplo.com",
        username,
        password: "contraseña-larga",
      }).success).toBe(false);
    }
  });
});

describe("userTierSchema", () => {
  it("solo admite los dos niveles de usuario definidos en la propuesta", () => {
    expect(userTierSchema.safeParse("NORMAL").success).toBe(true);
    expect(userTierSchema.safeParse("TOP").success).toBe(true);
    expect(userTierSchema.safeParse("PREMIUM").success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("exige una contraseña no vacía", () => {
    const result = loginSchema.safeParse({
      email: "persona@ejemplo.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("publicUserSchema", () => {
  it("valida la forma pública del usuario y descarta claves ajenas al contrato", () => {
    const parsed = publicUserSchema.parse({
      id: "3e2a1f60-0d3c-4a5e-9b0e-1f2a3b4c5d6e",
      email: "persona@ejemplo.com",
      username: "persona",
      tier: "NORMAL",
      createdAt: "2026-08-07T10:00:00.000Z",
      passwordHash: "jamás-debería-pasar",
    });
    expect(parsed).not.toHaveProperty("passwordHash");
    expect(parsed.createdAt).toBeInstanceOf(Date);
  });
});
