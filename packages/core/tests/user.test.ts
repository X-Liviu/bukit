import { describe, expect, it } from "vitest";

import { loginSchema, ownUserSchema, registerUserSchema, userTierSchema } from "../src/user";

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
      expect(
        registerUserSchema.safeParse({
          email: "persona@ejemplo.com",
          username,
          password: "contraseña-larga",
        }).success,
      ).toBe(false);
    }
  });

  it("acota la contraseña al límite real de bcrypt (72 bytes, no caracteres)", () => {
    const base = { email: "persona@ejemplo.com", username: "persona" };
    expect(registerUserSchema.safeParse({ ...base, password: "a".repeat(72) }).success).toBe(true);
    expect(registerUserSchema.safeParse({ ...base, password: "a".repeat(73) }).success).toBe(false);
    // 36 ñ = 72 bytes en UTF-8 (válida); 37 ñ = 74 bytes (rechazada aunque
    // tenga menos de 72 caracteres): la comprobación es en bytes.
    expect(registerUserSchema.safeParse({ ...base, password: "ñ".repeat(36) }).success).toBe(true);
    expect(registerUserSchema.safeParse({ ...base, password: "ñ".repeat(37) }).success).toBe(false);
  });

  it("acota el email al tope del estándar (254)", () => {
    const local = "a".repeat(250);
    expect(
      registerUserSchema.safeParse({
        email: `${local}@x.com`,
        username: "persona",
        password: "contraseña-larga",
      }).success,
    ).toBe(false);
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

describe("ownUserSchema", () => {
  it("valida la vista del propietario y descarta claves ajenas al contrato", () => {
    const parsed = ownUserSchema.parse({
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
