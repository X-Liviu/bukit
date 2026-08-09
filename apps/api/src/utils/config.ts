import "dotenv/config";

// Configuración de entorno (mismo patrón que utils/config en TrackBites).
// El import de "dotenv/config" carga el archivo .env como efecto secundario.

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

export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV ?? "development",
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
};
