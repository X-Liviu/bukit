import "dotenv/config";

// Configuración de entorno, el único módulo que lee process.env (mismo patrón
// que el utils/config de TrackBites). El import de "dotenv/config" carga el
// archivo .env como efecto secundario.

// El secreto de firma de los tokens NO tiene valor por defecto en producción:
// un secreto de reserva escrito en el código convertiría un despliegue mal
// configurado en uno que emite tokens falsificables por cualquiera que lea el
// repositorio. Fuera de producción se usa uno fijo de desarrollo para que las
// pruebas y el arranque local no exijan configuración previa.
function jwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) {
    if (fromEnv.length >= 32) return fromEnv;
    // Un secreto CONFIGURADO pero corto es un error en cualquier entorno:
    // ignorarlo en silencio y firmar con el de desarrollo (que está en el
    // repositorio) sería fabricar tokens falsificables sin avisar.
    throw new Error("JWT_SECRET demasiado corto: mínimo 32 caracteres.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET ausente: obligatorio en producción.");
  }
  return "secreto-de-desarrollo-solo-para-local-y-pruebas";
}

// Cabecera de la que sale la IP real del cliente (US-07). En Render, delante de
// la API están Cloudflare y el balanceador de Render: la IP del socket es la de
// un proxy, y la parte izquierda de X-Forwarded-For la escribe el propio
// cliente, así que no sirve. Cloudflare sobrescribe CF-Connecting-IP en cada
// petición. Se activa solo en Render (render.yaml); en local y en la CI no se
// define y manda la IP del socket. Un valor distinto es un error de
// configuración y la app no arranca: confiar en otra cabecera permitiría a
// cualquiera elegir su propia IP y saltarse los límites.
// Alternativa descartada: app.set("trust proxy", 3), el número de saltos
// observado en Render, que Render no documenta y puede cambiar.
export const CLIENT_IP_HEADERS = ["cf-connecting-ip"] as const;
export type ClientIpHeader = (typeof CLIENT_IP_HEADERS)[number];

function clientIpHeader(): ClientIpHeader | undefined {
  const raw = process.env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (!raw) return undefined;
  const allowed = CLIENT_IP_HEADERS.find((header) => header === raw);
  if (!allowed)
    throw new Error(`CLIENT_IP_HEADER no admitido: solo ${CLIENT_IP_HEADERS.join(", ")}.`);
  return allowed;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV ?? "development",
  /** Nivel del registro de sucesos; sin él, debug en desarrollo e info fuera. */
  logLevel: process.env.LOG_LEVEL,
  /**
   * Coste del hash bcrypt: 12 rondas por defecto (en torno a 1 s de CPU con
   * bcryptjs, asumible para altas esporádicas). Las pruebas lo bajan a 4
   * (vitest.config.ts). Getter, como el secreto: se lee en cada uso.
   */
  get bcryptRounds(): number {
    return Number(process.env.BCRYPT_ROUNDS ?? 12);
  },
  jwt: {
    get secret(): string {
      // Perezoso (getter) por el mismo motivo que el cliente de Prisma: el
      // esqueleto desplegado debe poder servir /health aunque falte
      // configuración; el error salta al emitir o verificar un token.
      return jwtSecret();
    },
    /** Vida del token de acceso: 15 minutos (ventana de robo mínima). */
    accessTtlSeconds: 15 * 60,
    /** Vida del token de refresco: 30 días, con rotación en cada uso (US-06). */
    refreshTtlSeconds: 30 * 24 * 60 * 60,
    issuer: "bukit-api",
  },
  // Doble capa de limitación de peticiones (US-07). Los umbrales son constantes
  // y no variables de entorno, para que ningún despliegue pueda relajarlos por
  // error. Ventanas de 15 min: coinciden con lo que tarda Render en dormir el
  // servicio, así que el sueño no borra ningún contador vivo.
  rateLimit: {
    /** Capa 1, por IP: alta e inicio de sesión comparten 20 peticiones. */
    byOrigin: { windowMs: 15 * 60 * 1000, limit: 20 },
    /** Capa 2, por cuenta e IP: 5 intentos de inicio de sesión. */
    byAccountAndOrigin: { windowMs: 15 * 60 * 1000, limit: 5 },
    get clientIpHeader(): ClientIpHeader | undefined {
      return clientIpHeader();
    },
  },
};
