import { Link } from "react-router";

// Página de las rutas que no existen; sin ella, el enrutador mostraría su
// pantalla de error genérica. Enlaza a la raíz, que redirige al inicio: el
// armazón no conoce las rutas de las funcionalidades.
export function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-title">
      <h2 id="not-found-title">Página no encontrada</h2>
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </section>
  );
}
