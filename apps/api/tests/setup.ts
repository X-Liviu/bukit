import "dotenv/config";

// Guarda de las pruebas (10-10-2026, antes de la US-06). Las pruebas de
// integración VACÍAN tablas reales en su beforeEach (prisma.user.deleteMany),
// y desde el 04-10 existe una base de producción en Neon cuya cadena de
// conexión está también en el equipo de desarrollo (.env.production, para
// comprobaciones puntuales). dotenv nunca sobrescribe una variable ya
// definida: si alguien exporta la cadena de Neon en su terminal para una
// consulta y después lanza `pnpm test` en la misma sesión, las pruebas
// borrarían todas las cuentas de producción. Por eso abortan antes de tocar
// nada si DATABASE_URL no apunta a esta máquina.
// Alternativa descartada: una lista de bases prohibidas (la de Neon); fallaría
// en abierto ante cualquier base remota nueva, mientras que permitir solo
// localhost falla en cerrado.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

const url = process.env.DATABASE_URL;
if (url) {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL no es una URL válida: las pruebas no se ejecutan.");
  }
  if (!LOCAL_HOSTS.has(host)) {
    // El mensaje no incluye la cadena ni el host: podría ser la de producción
    // y acabar en un registro de la CI.
    throw new Error(
      "DATABASE_URL no apunta a localhost: las pruebas vacían tablas reales y se niegan a ejecutarse contra una base remota.",
    );
  }
}
