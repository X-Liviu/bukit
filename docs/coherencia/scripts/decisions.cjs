// Fechas de decisiones y hechos citadas en CLAUDE.md y en la memoria, y si el diario las
// respalda: entrada propia de ese día, entrada que declara cubrirlo en su cabecera (p. ej.,
// la del 04-10 dice «Recoge el sábado 03-10 y el domingo 04-10») o ninguna («sin
// evidencia»). Las fechas futuras son planes y no se evalúan.
// Uso: node docs/coherencia/scripts/decisions.cjs [--today=YYYY-MM-DD] archivo [archivo…]
//   Por defecto: CLAUDE.md y los capítulos 7, 10, 13 y 14 de la memoria.
const fs = require("fs");
const path = require("path");

let today = null;
const files = [];
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--today=")) today = a.slice(8);
  else files.push(a);
}
if (!today) {
  const d = new Date();
  today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
if (!files.length) {
  files.push(
    "CLAUDE.md",
    "docs/thesis/chapters/07-analisis-riesgos.tex",
    "docs/thesis/chapters/10-tareas-fases-procedimientos.tex",
    "docs/thesis/chapters/13-gantt-tfg.tex",
    "docs/thesis/chapters/14-presupuesto.tex",
  );
}
const JOURNAL_DIR = "docs/dev-journal";
const entries = fs
  .readdirSync(JOURNAL_DIR)
  .filter((n) => /^\d{2}-\d{2}-\d{4}(-[a-z])?\.md$/.test(n))
  .map((n) => ({
    fileName: n,
    date: n.slice(0, 10),
    // Solo la cabecera (primeras 12 líneas): es donde una entrada declara qué días recoge.
    header: fs.readFileSync(path.join(JOURNAL_DIR, n), "utf8").split("\n").slice(0, 12),
  }));
const byDate = new Set(entries.map((e) => e.date));

// «Cubierta» exige, en la MISMA línea de la cabecera, la fecha (DD-MM) y una palabra que
// declare la cobertura; si no, cualquier plan que mencione la fecha contaría como evidencia.
function coverage(ddmmyyyy) {
  if (byDate.has(ddmmyyyy)) return { status: "entrada propia", entry: `${ddmmyyyy}.md` };
  const ddmm = ddmmyyyy.slice(0, 5);
  const reDate = new RegExp(`(^|[^0-9-])${ddmm}(-\\d{4})?([^0-9-]|$)`);
  const c = entries.find(
    (e) =>
      e.date !== ddmmyyyy &&
      e.header.some((l) => reDate.test(l) && /recoge|cubre|incluye|corresponde/i.test(l)),
  );
  return c
    ? { status: "cubierta por otra entrada", entry: c.fileName }
    : { status: "sin evidencia en el diario", entry: null };
}
const results = [];
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  fs.readFileSync(f, "utf8")
    .split("\n")
    .forEach((l, i) => {
      for (const m of l.matchAll(/\b(\d{2})[-/](\d{2})[-/](\d{4})\b/g)) {
        const [dd, mm, yyyy] = [m[1], m[2], m[3]];
        if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) continue;
        const iso = `${yyyy}-${mm}-${dd}`;
        const future = iso > today;
        const start = Math.max(0, m.index - 70);
        const context = l
          .slice(start, m.index + 80)
          .replace(/\s+/g, " ")
          .trim();
        const isDecision =
          /decisi[óo]n|decidi|acordad|regla|desde el|fijad|aprobad|criterio|re-?basad|cerrad|emitid|verificad|aplicad|integrad|implementad/i.test(
            context,
          );
        results.push({
          file: `${f}:${i + 1}`,
          date: `${dd}-${mm}-${yyyy}`,
          future,
          looksLikeDecision: isDecision,
          journal: future
            ? { status: "fecha futura: no se evalúa", entry: null }
            : coverage(`${dd}-${mm}-${yyyy}`),
          context: `…${context}…`,
        });
      }
    });
}
const withoutEvidence = results.filter(
  (r) => r.looksLikeDecision && r.journal.status === "sin evidencia en el diario",
);
console.log(
  JSON.stringify(
    {
      today,
      totalDates: results.length,
      decisionsWithoutEvidence: withoutEvidence,
      futureDates: results.filter((r) => r.future),
      coverageSummary: results.reduce(
        (acc, r) => ((acc[r.journal.status] = (acc[r.journal.status] || 0) + 1), acc),
        {},
      ),
      all: results,
    },
    null,
    1,
  ),
);
