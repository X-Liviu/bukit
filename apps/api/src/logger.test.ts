import { pino } from "pino";
import { describe, expect, it } from "vitest";

import { redactOptions } from "./logger";

// La redacción es la garantía de que los logs no contienen credenciales
// (hallazgo de la revisión adversarial del 27-07). Se prueba con un pino
// propio que escribe en memoria, porque el logger real va apagado en test.
describe("redacción del logger", () => {
  it("censura authorization, cookie y el cuerpo crudo que adjunta http-errors", () => {
    const lines: string[] = [];
    const testLogger = pino({ redact: redactOptions }, {
      write: (line: string) => {
        lines.push(line);
      },
    });

    testLogger.info(
      {
        req: { headers: { authorization: "Bearer SECRET-TOKEN", cookie: "session=SECRET-COOKIE" } },
        err: { body: '{"password":"hunter2"' },
      },
      "petición de prueba",
    );

    const output = lines.join("");
    expect(output).toContain("[REDACTED]");
    expect(output).not.toContain("SECRET-TOKEN");
    expect(output).not.toContain("SECRET-COOKIE");
    expect(output).not.toContain("hunter2");
  });
});
