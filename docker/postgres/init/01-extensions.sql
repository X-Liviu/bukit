-- Se ejecuta una sola vez, al crear la BD por primera vez.
-- Prisma también puede gestionarlas vía `postgresqlExtensions`; esto garantiza
-- que estén disponibles desde el minuto cero. CREATE ... IF NOT EXISTS es idempotente.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
