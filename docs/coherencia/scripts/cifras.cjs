// Registro de cifras clave por concepto (puntos, horas, holgura, euros, fechas con día de
// la semana, rangos de sprints, límites de producto, pruebas, versiones…) con archivo y
// línea de cada aparición, para que la lente «cifras» compare valores entre fuentes.
// Uso: node docs/coherencia/scripts/cifras.cjs [--desde=YYYY-MM-DD] ruta [ruta…]
//   Las rutas pueden ser archivos o carpetas (.md y .tex). En docs/dev-journal,
//   --desde filtra las entradas por la fecha de su nombre (DD-MM-YYYY).
const fs = require("fs");
const path = require("path");

const TOPE = 40;
const PATRONES = {
  puntos: /\b(\d{1,3})\s*(?:SP|puntos?)\b/g,
  horas: /\b(\d{2,3})\s*(?:h|horas)\b/g,
  horasPorSemana: /\b(\d{1,2})\s*(?:h\s*\/\s*semana|horas\s+semanales|h\s+por\s+semana)/gi,
  holgura: /holgura[^.\n]{0,80}?(\d{1,2})\s*(?:\\,)?\s*\\?%/gi,
  equivalenciaHorasPunto: /(\d[,.]\d)\s*h(?:oras)?\s*(?:\/|por)\s*(?:SP|punto)/gi,
  euros: /\b(\d{2,4})\s*(?:~|\\,)?\s*(?:€|euros)/g,
  fechasConDiaDeLaSemana:
    /\b(lunes|martes|miércoles|jueves|viernes|sábado|domingo),?\s+(\d{2}-\d{2}-\d{4})/gi,
  fechasEnLaMemoria: /\b(\d{2}\/\d{2}\/(?:\d{4}|\\thesisYear))/g,
  rangosDeSprints: /\bS(\d{1,2})\s*(?:–|—|-{1,2}|→)\s*S(\d{1,2})\b/g,
  limiteListas: /\b3\s+listas\b/gi,
  caducidadPublicaciones: /\b60\s*d[ií]as\b/gi,
  caducidadHistorias: /\b24\s*h(?:oras)?\b/gi,
  vidaTokenAcceso: /\b15\s*min/gi,
  vidaTokenRefresco: /\b30\s*d[ií]as\b/gi,
  rondasBcrypt: /\b(\d{1,2})\s*rondas\b/gi,
  secretoMinimo: /\b32\s*caracteres\b/gi,
  limiteBcrypt: /\b72\s*bytes\b/gi,
  pruebas: /\b(\d{1,3})\s*pruebas\b/gi,
  vulnerabilidades: /\b(\d{1,2})\s*vulnerabilidad/gi,
  // Sin los números de apartado (§1.4.1, «#### 1.4.1»).
  versiones: /(?<![§#]\s?)(?<![§#]\s?\d)\b\d+\.\d+\.\d+\b/g,
};

let desde = null;
const rutas = [];
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--desde=")) desde = a.slice(8);
  else rutas.push(a);
}
function fechaDeEntrada(nombre) {
  const m = /^(\d{2})-(\d{2})-(\d{4})(?:-[a-z])?\.md$/.exec(nombre);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
function archivos(ruta) {
  if (!fs.existsSync(ruta)) return [];
  if (fs.statSync(ruta).isFile()) return [ruta];
  return fs.readdirSync(ruta, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(ruta, e.name);
    if (e.isDirectory()) return e.name === "build" || e.name === "node_modules" ? [] : archivos(p);
    if (!/\.(md|tex)$/.test(e.name)) return [];
    const f = fechaDeEntrada(e.name);
    if (desde && f && f < desde) return [];
    return [p];
  });
}

const grupos = Object.fromEntries(Object.keys(PATRONES).map((k) => [k, []]));
for (const f of rutas.flatMap(archivos)) {
  const r = path.relative(process.cwd(), f).replace(/\\/g, "/");
  fs.readFileSync(f, "utf8")
    .split("\n")
    .forEach((l, i) => {
      for (const [k, re] of Object.entries(PATRONES)) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(l))) {
          const ini = Math.max(0, m.index - 40);
          grupos[k].push(`${r}:${i + 1}: …${l.slice(ini, m.index + m[0].length + 40).trim()}…`);
        }
      }
    });
}
for (const [k, v] of Object.entries(grupos)) {
  console.log(`\n### ${k} (${v.length})`);
  v.slice(0, TOPE).forEach((x) => console.log(`- ${x}`));
  if (v.length > TOPE) console.log(`- … y ${v.length - TOPE} más`);
}
