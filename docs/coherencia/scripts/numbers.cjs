// Registro de cifras clave por concepto (puntos, horas, holgura, euros, fechas con día de
// la semana, rangos de sprints, límites de producto, pruebas, versiones…) con archivo y
// línea de cada aparición, para que la lente «cifras» compare valores entre fuentes.
// Uso: node docs/coherencia/scripts/numbers.cjs [--since=YYYY-MM-DD] ruta [ruta…]
//   Las rutas pueden ser archivos o carpetas (.md y .tex). En docs/dev-journal,
//   --since filtra las entradas por la fecha de su nombre (DD-MM-YYYY).
const fs = require("fs");
const path = require("path");

const LIMIT = 40;
const PATTERNS = {
  points: /\b(\d{1,3})\s*(?:SP|puntos?)\b/g,
  hours: /\b(\d{2,3})\s*(?:h|horas)\b/g,
  hoursPerWeek: /\b(\d{1,2})\s*(?:h\s*\/\s*semana|horas\s+semanales|h\s+por\s+semana)/gi,
  slack: /holgura[^.\n]{0,80}?(\d{1,2})\s*(?:\\,)?\s*\\?%/gi,
  hoursPerPoint: /(\d[,.]\d)\s*h(?:oras)?\s*(?:\/|por)\s*(?:SP|punto)/gi,
  euros: /\b(\d{2,4})\s*(?:~|\\,)?\s*(?:€|euros)/g,
  datesWithWeekday:
    /\b(lunes|martes|miércoles|jueves|viernes|sábado|domingo),?\s+(\d{2}-\d{2}-\d{4})/gi,
  thesisDates: /\b(\d{2}\/\d{2}\/(?:\d{4}|\\thesisYear))/g,
  sprintRanges: /\bS(\d{1,2})\s*(?:–|—|-{1,2}|→)\s*S(\d{1,2})\b/g,
  listLimit: /\b3\s+listas\b/gi,
  postExpiry: /\b60\s*d[ií]as\b/gi,
  storyExpiry: /\b24\s*h(?:oras)?\b/gi,
  accessTokenLifetime: /\b15\s*min/gi,
  refreshTokenLifetime: /\b30\s*d[ií]as\b/gi,
  bcryptRounds: /\b(\d{1,2})\s*rondas\b/gi,
  minSecretLength: /\b32\s*caracteres\b/gi,
  bcryptLimit: /\b72\s*bytes\b/gi,
  tests: /\b(\d{1,3})\s*pruebas\b/gi,
  vulnerabilities: /\b(\d{1,2})\s*vulnerabilidad/gi,
  // Sin los números de apartado (§1.4.1, «#### 1.4.1»).
  versions: /(?<![§#]\s?)(?<![§#]\s?\d)\b\d+\.\d+\.\d+\b/g,
};

let since = null;
const targets = [];
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--since=")) since = a.slice(8);
  else targets.push(a);
}
function entryDate(fileName) {
  const m = /^(\d{2})-(\d{2})-(\d{4})(?:-[a-z])?\.md$/.exec(fileName);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
function listFiles(entryPath) {
  if (!fs.existsSync(entryPath)) return [];
  if (fs.statSync(entryPath).isFile()) return [entryPath];
  return fs.readdirSync(entryPath, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(entryPath, e.name);
    if (e.isDirectory()) return e.name === "build" || e.name === "node_modules" ? [] : listFiles(p);
    if (!/\.(md|tex)$/.test(e.name)) return [];
    const f = entryDate(e.name);
    if (since && f && f < since) return [];
    return [p];
  });
}

const groups = Object.fromEntries(Object.keys(PATTERNS).map((k) => [k, []]));
for (const f of targets.flatMap(listFiles)) {
  const r = path.relative(process.cwd(), f).replace(/\\/g, "/");
  fs.readFileSync(f, "utf8")
    .split("\n")
    .forEach((l, i) => {
      for (const [k, re] of Object.entries(PATTERNS)) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(l))) {
          const start = Math.max(0, m.index - 40);
          groups[k].push(`${r}:${i + 1}: …${l.slice(start, m.index + m[0].length + 40).trim()}…`);
        }
      }
    });
}
for (const [k, v] of Object.entries(groups)) {
  console.log(`\n### ${k} (${v.length})`);
  v.slice(0, LIMIT).forEach((x) => console.log(`- ${x}`));
  if (v.length > LIMIT) console.log(`- … y ${v.length - LIMIT} más`);
}
