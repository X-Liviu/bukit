import "dotenv/config";

// Configuración de entorno (mismo patrón que utils/config en TrackBites).
// El import de "dotenv/config" carga el archivo .env como efecto secundario.
export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV ?? "development",
};
