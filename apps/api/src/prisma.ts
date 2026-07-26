// Marcador de posición del cliente Prisma hasta que el esquema tenga modelos (US-04).
// El esquema está vacío a propósito (diseño incremental con el autor), así que
// `prisma generate` aún no puede ejecutarse y el tipo PrismaClient solo existe si
// el postinstall de @prisma/client llegó a crear el stub `.prisma`: importarlo aquí
// hacía el typecheck NO determinista en CI (verde o rojo según la caché de pnpm).
// Con el primer modelo, restaurar: import de PrismaClient, singleton reutilizado
// entre recargas de tsx watch (para no agotar el pool de conexiones) y el paso
// `prisma generate` de la CI (ver comentario en .github/workflows/ci.yml).
export {};
