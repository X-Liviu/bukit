// Recuento de identificadores (EP, RF, RNF, US y R) en CLAUDE.md, la memoria y el diario, para
// la lente de producto y método de /coherencia. Sustituye a `git grep | sort | uniq -c`:
// desde el 15-11-2026 el perfil de la auditoría deniega sort y uniq, que con un archivo como
// argumento podían leer apps/api/.env.production. Usa git grep, que respeta .gitignore.
// Aviso: «R2» casa también con Cloudflare R2.
// Uso: node docs/coherencia/scripts/ids.cjs   (desde la raíz del repositorio)
const { execFileSync } = require("child_process");

const out = execFileSync(
  "git",
  [
    "grep",
    "--untracked",
    "-hoE",
    "(EP[0-9]{2}|RF-[0-9]{2}|RNF-[0-9]{2}|US-[0-9]{2}|R1[0-9]|R[1-9])",
    "--",
    "CLAUDE.md",
    "docs/thesis/chapters",
    "docs/dev-journal",
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
const counts = {};
for (const id of out.split(/\r?\n/).filter(Boolean)) counts[id] = (counts[id] || 0) + 1;
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
console.log(JSON.stringify(Object.fromEntries(sorted), null, 1));
