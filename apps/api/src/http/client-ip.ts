import { isIP } from "node:net";
import type { Request } from "express";
import { ipKeyGenerator } from "express-rate-limit";

import type { ClientIpHeader } from "../config.js";

/**
 * Clave de origen de una petición para la limitación de peticiones (US-07).
 * Con la cabecera de confianza configurada (CF-Connecting-IP en Render) se usa
 * su valor solo si es una IP: un valor inventado cae en el cupo del socket en
 * lugar de abrir uno propio. Sin cabecera, la IP del socket. Después,
 * ipKeyGenerator agrupa cada IPv6 en su red /56 (quien tiene una IPv6 suele
 * tener la red entera, y rotar direcciones abriría cupos sin fin) y trata una
 * IPv4 mapeada (::ffff:a.b.c.d) como la IPv4 que es.
 */
export function clientIpKey(req: Request, header: ClientIpHeader | undefined): string {
  const fromHeader = header ? req.get(header)?.trim() : undefined;
  const ip = fromHeader && isIP(fromHeader) ? fromHeader : (req.socket.remoteAddress ?? "");
  return ipKeyGenerator(ip);
}
