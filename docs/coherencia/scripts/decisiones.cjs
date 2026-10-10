// Fechas de decisiones y hechos citadas en CLAUDE.md y en la memoria, y si el diario las
// respalda: entrada propia de ese día, entrada que declara cubrirlo en su cabecera (p. ej.,
// la del 04-10 dice «Recoge el sábado 03-10 y el domingo 04-10») o ninguna («sin
// evidencia»). Las fechas futuras son planes y no se evalúan.
// Uso: node docs/coherencia/scripts/decisiones.cjs [--hoy=YYYY-MM-DD] archivo [archivo…]
//   Por defecto: CLAUDE.md y los capítulos 7, 10, 13 y 14 de la memoria.
const fs = require("fs");
const path = require("path");

let hoy = null;
const archivos = [];
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--hoy=")) hoy = a.slice(6);
  else archivos.push(a);
}
if (!hoy) {
  const d = new Date();
  hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
if (!archivos.length) {
  archivos.push(
    "CLAUDE.md",
    "docs/thesis/chapters/07-analisis-riesgos.tex",
    "docs/thesis/chapters/10-tareas-fases-procedimientos.tex",
    "docs/thesis/chapters/13-gantt-tfg.tex",
    "docs/thesis/chapters/14-presupuesto.tex",
  );
}
const DIARIO = "docs/dev-journal";
const entradas = fs
  .readdirSync(DIARIO)
  .filter((n) => /^\d{2}-\d{2}-\d{4}(-[a-z])?\.md$/.test(n))
  .map((n) => ({
    nombre: n,
    fecha: n.slice(0, 10),
    // Solo la cabecera (primeras 12 líneas): es donde una entrada declara qué días recoge.
    cabecera: fs.readFileSync(path.join(DIARIO, n), "utf8").split("\n").slice(0, 12),
  }));
const porFecha = new Set(entradas.map((e) => e.fecha));

// «Cubierta» exige, en la MISMA línea de la cabecera, la fecha (DD-MM) y una palabra que
// declare la cobertura; si no, cualquier plan que mencione la fecha contaría como evidencia.
function cobertura(ddmmyyyy) {
  if (porFecha.has(ddmmyyyy)) return { estado: "entrada propia", entrada: `${ddmmyyyy}.md` };
  const ddmm = ddmmyyyy.slice(0, 5);
  const reFecha = new RegExp(`(^|[^0-9-])${ddmm}(-\\d{4})?([^0-9-]|$)`);
  const c = entradas.find(
    (e) =>
      e.fecha !== ddmmyyyy &&
      e.cabecera.some((l) => reFecha.test(l) && /recoge|cubre|incluye|corresponde/i.test(l)),
  );
  return c
    ? { estado: "cubierta por otra entrada", entrada: c.nombre }
    : { estado: "sin evidencia en el diario", entrada: null };
}
const resultado = [];
for (const f of archivos) {
  if (!fs.existsSync(f)) continue;
  fs.readFileSync(f, "utf8")
    .split("\n")
    .forEach((l, i) => {
      for (const m of l.matchAll(/\b(\d{2})[-/](\d{2})[-/](\d{4})\b/g)) {
        const [dd, mm, yyyy] = [m[1], m[2], m[3]];
        if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) continue;
        const iso = `${yyyy}-${mm}-${dd}`;
        const futura = iso > hoy;
        const ini = Math.max(0, m.index - 70);
        const contexto = l
          .slice(ini, m.index + 80)
          .replace(/\s+/g, " ")
          .trim();
        const esDecision =
          /decisi[óo]n|decidi|acordad|regla|desde el|fijad|aprobad|criterio|re-?basad|cerrad|emitid|verificad|aplicad|integrad|implementad/i.test(
            contexto,
          );
        resultado.push({
          archivo: `${f}:${i + 1}`,
          fecha: `${dd}-${mm}-${yyyy}`,
          futura,
          pareceDecision: esDecision,
          diario: futura
            ? { estado: "fecha futura: no se evalúa", entrada: null }
            : cobertura(`${dd}-${mm}-${yyyy}`),
          contexto: `…${contexto}…`,
        });
      }
    });
}
const sinEvidencia = resultado.filter(
  (r) => r.pareceDecision && r.diario.estado === "sin evidencia en el diario",
);
console.log(
  JSON.stringify(
    {
      hoy,
      totalFechas: resultado.length,
      decisionesSinEvidencia: sinEvidencia,
      fechasFuturas: resultado.filter((r) => r.futura),
      resumenCobertura: resultado.reduce(
        (acc, r) => ((acc[r.diario.estado] = (acc[r.diario.estado] || 0) + 1), acc),
        {},
      ),
      todas: resultado,
    },
    null,
    1,
  ),
);
