import { QueryClient } from "@tanstack/react-query";

// Caché del estado de servidor (TanStack Query). Es una factoría y no una
// instancia del módulo por la misma razón que los routers de la API: guarda
// estado, y cada instancia de la app debe estrenar el suyo. Las opciones por
// defecto se fijan cuando llegue la primera consulta real (US-09).
export function createQueryClient(): QueryClient {
  return new QueryClient();
}
